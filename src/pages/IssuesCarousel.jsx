// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {Carousel} from "@material-tailwind/react";
// import API from "../api";
// export default function Dashboard() {
//   const [issues, setIssues] = useState([]);
//   const [filter, setFilter] = useState("");

//   useEffect(() => {
//     // Simulated issue fetch - replace with API call
//     const fetchIssues = async () => {
      
//         API.get("/issues")
//         .then(res=>{
//           const resIssues = res.data.filter(item=>item.isOpen===true);
//           setIssues(resIssues);
//         })
//         .catch(err=>{
//           console.log(err);
//         });
//     };
//     fetchIssues();
//   }, []);

//   const filteredIssues = filter
//     ? issues.filter((i) => i.language.toLowerCase().includes(filter.toLowerCase()))
//     : issues;

//   return (
//     <div className=" bg-gray-100 p-6">
//       <div className="max-w-4xl mx-auto">
//         <h2 className="text-3xl font-bold text-blue-600 mb-6">Solver Dashboard</h2>

//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Filter by language (e.g. Python)"
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             className="w-full px-4 py-2 border rounded-xl"
//           />
//         </div>

//         <div className="grid gap-4">
//           {filteredIssues.length > 0 ? (
//             filteredIssues.map((issue) => (
//                 <Carousel className="rounded-xl">
//               <div
//                 key={issue.id}
//                 className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
//               >
//                 <div>
//                   <h3 className="text-xl font-semibold text-gray-800">
//                     {issue.title}
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Language: {issue.language} · Urgency: {issue.urgency}
//                   </p>
//                 </div>
//                 <div className="mt-4 sm:mt-0 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700">
//                 <Link to="/dashboard/livesession">session</Link>
//                 </div>
//               </div>
//               </Carousel>
//             ))
//           ) : (
//             <p className="text-gray-500 text-center">No issues found</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
