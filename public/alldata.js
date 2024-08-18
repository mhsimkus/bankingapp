import { useEffect, useState } from "react";
import Button from "react-bootstrap/esm/Button";
import { useAuth } from "../context";
import Loading from "../components/loading";
import { Card, Col, Row } from "react-bootstrap";

const calculateTotalBalance = (accounts) => {
  return accounts.reduce((total, account) => total + account.balance, 0);
};

export default function AllData() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (user && user.userRole === "employee") {
      fetchAllData();
    }
  }, []);

  function fetchAllData() {
    fetch("/account/all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  function handleDelete(email) {
    if (
      window.confirm(
        `Are you sure you want to delete the user with email: ${email}?`
      )
    ) {
      fetch(`/account/delete/${email}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          fetchAllData();
        })
        .catch((error) => {
          console.error("Error deleting user:", error);
        });
    }
  }

  if (!user) {
    return <Loading />;
  }

  if (user.userRole !== "employee") {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-4">All Data in Store</h1>
      <Row>
        {data.map((user) => (
          <Col md={6} lg={4} className="mb-4" key={user.name}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                {user.name}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(user.email)}
                  disabled={
                    user.email === "miranda@badbank.com" ||
                    user.email === "harry@mail.com"
                  }
                >
                  Delete
                </Button>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <strong>Email:</strong> {user.email}
                  <br />
                  {user.userRole === "client" && (
                    <>
                      <strong>Number of accounts: </strong>
                      {user.accounts ? user.accounts.length : 0}
                      <br />
                      <strong>Balance: </strong>
                      {user.accounts
                        ? formatCurrency(calculateTotalBalance(user.accounts))
                        : formatCurrency(0)}
                      <br />
                    </>
                  )}
                  <strong>User Role:</strong> {user.userRole}
                  <br />
                  <strong>Password:</strong> {user.password}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
