import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BankForm from "../components/BankForm";
import { useAuth } from "../context";
import { Alert, Button, Card, Col, Row } from "react-bootstrap";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  async function handleLogin(data) {
    try {
      await login(data);
      setStatus("Login successful!");
    } catch (error) {
      setStatus(error.message);
      setTimeout(() => {
        setStatus("");
        navigate("/");
      }, 2000);
    }
  }

  function handleDemoLogin(email, password) {
    handleLogin({ email, password });
  }

  return (
    <>
      <h1 className="mb-4">Welcome back!</h1>
      <p>Enter your email and password to log in.</p>

      <BankForm
        bgcolor=""
        txtcolor="black"
        label="Login"
        handleClick={handleLogin}
        hideAmount={true}
        successButton="Login"
        isLoginForm={true}
        statusFromRequest={status}
      />

      <p>
        Don't have an account? <a href="/createaccount">Create one</a>
      </p>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Demo Employee/Admin Account</Card.Title>
              <Alert variant="secondary">
                <p>
                  <strong>Email:</strong> miranda@badbank.com
                  <br />
                  <strong>Password:</strong> 12345678
                </p>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleDemoLogin("miranda@badbank.com", "12345678")
                  }
                >
                  Login as Admin
                </Button>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Demo Client/User Account</Card.Title>
              <Alert variant="secondary">
                <p>
                  <strong>Email:</strong> harry@mail.com
                  <br />
                  <strong>Password:</strong> 12345678
                </p>
                <Button
                  variant="primary"
                  onClick={() => handleDemoLogin("harry@mail.com", "12345678")}
                >
                  Login as Client
                </Button>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}