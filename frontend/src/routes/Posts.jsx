import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Posts(){
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const posts = useQuery({ queryKey: ["posts"], queryFn: () => api("/posts") });
  const create = useMutation({
    mutationFn: () => api("/posts", { method: "POST", body: { title, body: "hello" } }),
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["posts"] }); }
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-3">Posts</h2>
      <form className="flex gap-2 mb-4" onSubmit={(e)=>{e.preventDefault(); create.mutate();}}>
        <input className="border px-3 py-2 flex-1" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"/>
        <button className="px-3 py-2 border rounded">Add</button>
      </form>
      {posts.isLoading ? <p>Loading…</p> : <ul className="space-y-2">
        {posts.data?.map(p => <li key={p._id||p.id} className="border rounded p-3"><b>{p.title}</b></li>)}
      </ul>}
    </div>
  );
}
