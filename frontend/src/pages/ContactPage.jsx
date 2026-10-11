import { useLocation, useOutletContext } from "react-router-dom";
import Contact from "../components/Contact.jsx";

export default function ContactPage() {
  const { info } = useOutletContext();
  const location = useLocation();
  return <Contact info={info} prefillMessage={location.state?.prefillMessage || ""} />;
}
