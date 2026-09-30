import { useOutletContext } from "react-router-dom";
import BranchesSection from "../BranchesSection.jsx";

export default function AdminBranchesPage() {
  const { token, notify } = useOutletContext();
  return <BranchesSection token={token} onNotice={notify} />;
}
