import { BrowserRouter } from "react-router-dom";
import MyRoutes from "./components/MyRoutes";
import Footer from "./components/Footer"; // <-- Import Footer!
import Header from "./components/Header"
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <BrowserRouter>
      <Header />
        <MyRoutes/>
        <Footer />
      </BrowserRouter>
    
    </div>
  );
}

export default App;