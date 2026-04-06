import { Outlet } from 'react-router-dom';  
import Footer from "../home/Footer";
import Header from "../home/Header";


export default function Root() {

  return (
    <div>
       <Header></Header>
       <Outlet></Outlet>
       <Footer></Footer>
    </div>
  );
}