import { useOutletContext } from "react-router-dom";
import LivestreamSection from "../LivestreamSection.jsx";

export default function AdminLivestreamPage() {
  const { token, notify } = useOutletContext();
  return <LivestreamSection token={token} onNotice={notify} />;
}
