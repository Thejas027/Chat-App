import DashBoard from "./modules/Dashboard";
import Form from "./modules/Form";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashBoard />} />
      <Route path="/users/sign_in" element={<Form isSignPage={true} />} />
      <Route path="/users/sign_up" element={<Form isSignPage={false} />} />
    </Routes>
  );
}

export default App;
