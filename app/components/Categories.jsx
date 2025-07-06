
import { FaSearch } from "react-icons/fa";
import Link from "next/link";

export default function categories({data}){

    return (
        <section className="bg-[white]">
            <div className="hero flex h-50  md:hidden bg-[#f5f5f5]">
                <input 
                    type="search" 
                    aria-label="search-box"
                    name="search"
                    placeholder="what are you looking for?"
                    className="border rounded-l-full border-r-0 pl-5 h-10 w-[50%] mt-20 ml-auto bg-[white] text-[grey]"
                />
                <div className="border rounded-r-full w-15 h-10 mt-20 bg-[#5c2334] hover:bg-[#e7302a] mr-auto">
                <span><FaSearch className="text-4xl pl-3 w-9 text-[white]"/></span>
                </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 text-center ">
                {data.map((item) => {
                    const slug = item.name.toLowerCase().replace(/\s+/g, "-"); // e.g. "Gaming Consoles" -> "gaming-consoles"
                    return (
                        <Link href={`/categories/${slug}`} key={item.key}>
                            <div className="categories border cursor-pointer hover:shadow-lg p-4 rounded-xl bg-[#f5f5f5] hover:bg-[#e7302a]">
                                <span className="text-2xl ">{item.emoji}</span>
                                <p className="text-base">{item.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
                
                
                
        </section>
    )
}