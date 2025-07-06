
import { FaSearch } from "react-icons/fa";
import Link from "next/link";

export default function categories({data}){

    return (
        <section className="">
            <div className="hero flex border h-50 md:hidden">
                <input 
                    type="search" 
                    aria-label="search-box"
                    name="search"
                    placeholder="what are you looking for?"
                    className="border rounded-l-full border-r-0 pl-5 h-10 w-80 mt-20 ml-30"
                />
                <span className="border rounded-r-full w-20 h-10 mt-20">
                <span><FaSearch className="text-4xl pl-3 "/></span>
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 text-center border ">
                {data.map((item) => {
                    const slug = item.name.toLowerCase().replace(/\s+/g, "-"); // e.g. "Gaming Consoles" -> "gaming-consoles"
                    return (
                        <Link href={`/categories/${slug}`} key={item.key}>
                            <div className="categories border cursor-pointer hover:shadow-lg p-4 rounded-xl">
                                <span className="text-8xl ">{item.emoji}</span>
                                <p className="text-l">{item.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
                
                
                
        </section>
    )
}