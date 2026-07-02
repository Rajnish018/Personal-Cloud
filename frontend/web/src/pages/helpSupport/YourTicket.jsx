import { Navigate, useParams } from "react-router-dom";

const YourTicket = () => {
  const { id } = useParams();
  return <Navigate to={`/chat/${id}`} replace />;
};

export default YourTicket;
