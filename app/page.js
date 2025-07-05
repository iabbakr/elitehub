import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";  
import Categories from "./components/Categories";    
import CategoriesData from "./lib/categoriesData";
export default function Home() {
  return (
    <div className="">
      <main className="">
        
      
      <Header />
      <Categories data={CategoriesData}/>
      <Footer />
      </main>
    </div>
  );
}
