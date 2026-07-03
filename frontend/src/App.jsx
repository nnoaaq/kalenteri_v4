import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import FormGroup from "react-bootstrap/esm/FormGroup";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { MdErrorOutline, MdCheck, MdLogin } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { SiMealie } from "react-icons/si";
import { useState } from "react";
import FormLabel from "react-bootstrap/esm/FormLabel";
import { useEffect } from "react";
function App() {
  const server = "https://kalenteri-v4.onrender.com;
  const [isLoggedIn, setisLoggedIn] = useState(false);
  const [error, setError] = useState(false);
  const [calendars, setCalendars] = useState(false);
  const [addedWorkDays, setAddedWorkDays] = useState([]);
  useEffect(() => {
    async function verifyTokens() {
      const tokenRes = await fetch(`${server}/auth/verify`, {
        credentials: "include",
      });
      const tokenResData = await tokenRes.json();
      if (tokenResData.success) {
        setisLoggedIn(tokenResData.success);
        const calendarsRes = await fetch(`${server}/calendar/get-list`);
        if (calendarsRes.ok) {
          const calendarsData = await calendarsRes.json();
          setCalendars(calendarsData);
        }
      }
    }
    verifyTokens();
  }, []);
  async function generateAuthUrl() {
    const authUrlRes = await fetch(`${server}/auth/generate-auth-url`);
    if (!authUrlRes.ok) {
      setError("Virhe Googlen tunnistautumisessa");
      return;
    }
    const authUrlData = await authUrlRes.json();
    window.location = authUrlData.authUrl;
  }
  async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submittedFile = formData.get("file");
    const calendarId = formData.get("calendar");
    if (submittedFile.size === 0) {
      // Ei tiedostoa
      setError("Työvuorolista tulee valita ensin");
      return;
    } else if (submittedFile.size > 5 * 1024 * 1024) {
      // Tiedosto liian suuri
      setError("Valittu tiedosto on liian suuri");
      return;
    }
    setError(false); // Poistetaan mahdollinen virhe-ilmoitus
    const formRes = await fetch(`${server}/file/send`, {
      method: "POST",
      body: formData,
    });
    const formResData = await formRes.json();
    setAddedWorkDays(formResData.workDays);
  }
  function convertMinutesToTime(minutes) {
    const clockHours = Math.floor(minutes / 60);
    const clockMinutes = minutes % 60;
    return `${clockHours}:${clockMinutes}`;
  }
  function convertToClock(IsoFormat) {
    const dateObj = new Date(IsoFormat);
    return `${dateObj.getHours()}:${dateObj.getMinutes()}`;
  }
  return (
    <>
      <Container className="min-vh-100 d-flex flex-column align-items-center justify-content-center">
        {error && (
          <>
            <Alert variant="danger" dismissible onClose={() => setError(false)}>
              {error}
            </Alert>
          </>
        )}
        <Card className="shadow">
          <Card.Title className="p-2 border-bottom">
            <h4>Tallenna työvuorot kalenteriin</h4>
          </Card.Title>

          <Card.Body className="pt-0">
            {isLoggedIn ? (
              <>
                <p className="border-bottom">
                  Yhteys Googleen kunnossa <MdCheck color="green" />
                </p>
              </>
            ) : (
              <div className="d-flex justify-content-between ">
                <p className="mb-0">
                  Ei yhteyttä Googleen <MdErrorOutline color="red" />
                </p>
                <Button size="sm" onClick={generateAuthUrl}>
                  Tunnistaudu <MdLogin />
                </Button>
              </div>
            )}
            <Form onSubmit={handleFormSubmit}>
              <FormGroup>
                <Form.Label>Valitse haluttu työvuorolista</Form.Label>
                <Form.Control type="file" disabled={!isLoggedIn} name="file" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Valitse kalenteri</FormLabel>
                <Form.Select name="calendar" disabled={!isLoggedIn}>
                  {calendars &&
                    calendars.map((calendar) => {
                      return (
                        <option value={calendar.id} key={calendar.id}>
                          {calendar.summary}
                        </option>
                      );
                    })}
                </Form.Select>
              </FormGroup>
              <div className="d-grid pt-3">
                <Button disabled={!isLoggedIn} type="submit">
                  Lähetä
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        <Container className="py-4">
          <Row xs={2} lg={3} xl={4} className="g-1">
            {addedWorkDays &&
              addedWorkDays.map((addedWorkDay) => {
                return (
                  <Col key={addedWorkDay.date}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="d-flex flex-column justify-content-center">
                        <Card.Title className="text-center mb-2">
                          {addedWorkDay.date}
                          <p className="fs-6 m-0 p-0">
                            {convertToClock(addedWorkDay.start)} -{" "}
                            {convertToClock(addedWorkDay.end)}
                          </p>
                        </Card.Title>

                        <p className="text-center p-0 m-0 mb-2 text-muted">
                          {addedWorkDay.summary}
                        </p>

                        <p className="text-center m-0 ">
                          <IoMdTime />{" "}
                          {convertMinutesToTime(addedWorkDay.dayDuration)}h /{" "}
                          <SiMealie /> {addedWorkDay.lunchBreak} min
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </Container>
      </Container>
    </>
  );
}
export default App;
