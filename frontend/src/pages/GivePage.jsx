import { useOutletContext } from "react-router-dom";
import Give from "../components/Give.jsx";

export default function GivePage() {
  const { info } = useOutletContext();
  return <Give info={info} />;
}
