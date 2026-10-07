FROM node:22-bookworm-slim AS web
WORKDIR /web
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-21 AS api
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -B dependency:go-offline
COPY backend/src ./src
COPY --from=web /web/dist ./src/main/resources/static
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system fitflix && useradd --system --gid fitflix fitflix
WORKDIR /app
COPY --from=api /build/target/fitplix-api-1.0.0.jar app.jar
COPY infra/cloud-entrypoint.sh /app/cloud-entrypoint.sh
USER fitflix
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["sh", "/app/cloud-entrypoint.sh"]
