import unittest
from production_preflight import validate
class PreflightTest(unittest.TestCase):
    def config(self):
        return dict(JWT_SECRET='abcdefghijklmnopqrstuvwxyz0123456789ABCD',DATABASE_PASSWORD='abcdefghijklmnopqrstuvXYZ123456789',APP_ORIGIN='https://fitplix.company.com',SECURE_COOKIE='true',DEMO_MODE='false',MAIL_ENABLED='true',SMTP_TLS='true',SMTP_AUTH='true',SMTP_HOST='smtp.company.com',SMTP_USERNAME='sender',SMTP_PASSWORD='fixture-only',MAIL_FROM='hello@company.com')
    def test_valid_configuration(self):self.assertEqual([],validate(self.config()))
    def test_rejects_unsafe_settings_without_echoing_values(self):
        env=self.config();env.update(APP_ORIGIN='http://localhost:5173',DEMO_MODE='true',SECURE_COOKIE='false',SMTP_TLS='false',JWT_SECRET='secret')
        issues=validate(env)
        self.assertEqual(5,len(issues));self.assertNotIn('localhost',str(issues))
    def test_empty_configuration_is_blocked(self):self.assertGreater(len(validate({})),5)
if __name__=='__main__':unittest.main()
