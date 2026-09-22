import { Link } from "react-router-dom";
import { Smartphone, ScanLine, Wifi, ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import "./InstallationGuidePage.css";

const STEPS = [
  {
    title: "Open your eSIM order",
    body: "Go to My eSIMs and open the order you just completed — the QR code and LPA details are on that page.",
  },
  {
    title: "iPhone: one tap install",
    body: 'Tap the "iPhone" one-click install button on your order page (iOS 17.4+). Your phone will prompt to add the eSIM automatically — no scanning needed.',
  },
  {
    title: "Any phone: scan the QR code",
    body: "Settings → Cellular / Mobile Data → Add eSIM → Use QR Code, then scan the code shown on your order page. Works on iPhone and Android.",
  },
  {
    title: "No camera access? Enter manually",
    body: "Choose \"Enter Details Manually\" and type in the SM-DP+ address and activation code shown on your order page instead of scanning.",
  },
  {
    title: "Turn on data roaming",
    body: "After the eSIM installs, go to its settings and enable Data Roaming — most eSIM data plans are roaming profiles and won't connect otherwise.",
  },
  {
    title: "Confirm it's connected",
    body: "Check the signal indicator for your new eSIM line, or use \"Check live usage\" on your order page to confirm data is flowing.",
  },
];

export function InstallationGuidePage() {
  return (
    <div className="container installation-page">
      <Link to="/my-esims" className="back-link">
        <ArrowLeft size={16} /> My eSIMs
      </Link>

      <header>
        <span className="eyebrow">Setup</span>
        <h1>Installing your eSIM</h1>
        <p>Takes about 2 minutes. Keep your order page open in another tab for the QR code and details.</p>
      </header>

      <div className="installation-icons">
        <div>
          <Smartphone size={22} />
          <span>Works on iPhone &amp; Android</span>
        </div>
        <div>
          <ScanLine size={22} />
          <span>QR code or manual entry</span>
        </div>
        <div>
          <Wifi size={22} />
          <span>Enable roaming after install</span>
        </div>
      </div>

      <ol className="installation-steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <Card className="installation-step-card">
              <span className="installation-step-number">{i + 1}</span>
              <div>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="installation-help-card">
        <h2>Still stuck?</h2>
        <p>
          Open your order in My eSIMs and use "Check live usage" to confirm the eSIM is active, or check refund
          eligibility if it never connects.
        </p>
        <Link to="/my-esims">
          <Button variant="secondary">Go to My eSIMs</Button>
        </Link>
      </Card>
    </div>
  );
}
