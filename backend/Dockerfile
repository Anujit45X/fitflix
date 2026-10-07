FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B package -DskipTests
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S fitplix && adduser -S fitplix -G fitplix
WORKDIR /app
COPY --from=build /build/target/fitplix-api-1.0.0.jar app.jar
USER fitplix
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-jar","/app/app.jar"]
