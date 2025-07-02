import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";      


export default function Home() {
  return (
    <div className="">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        
      
      <Header />
      <Footer />
      </main>
    </div>
  );
}
