import { useOutletContext } from "react-router-dom";
import Events from "../components/Events.jsx";

export default function EventsPage() {
  const { info, events } = useOutletContext();
  return <Events info={info} events={events} />;
}
