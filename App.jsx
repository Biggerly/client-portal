import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Initialize Supabase (Replace with your actual credentials)
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

const UploadPortal = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.target);
    const file = formData.get('file');
    const content = formData.get('content');
    const clientName = formData.get('clientName');

    try {
      // 1. Upload File to Supabase Storage
      let filePath = null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-assets')
          .upload(`${clientName}/${fileName}`, file);

        if (uploadError) throw uploadError;
        filePath = uploadData.path;
      }

      // 2. Save metadata/text to Supabase Table
      const { error: dbError } = await supabase
        .from('client_submissions')
        .insert([{ 
          client_name: clientName, 
          body_text: content, 
          file_url: filePath 
        }]);

      if (dbError) throw dbError;

      setStatus('success');
      e.target.reset();
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">
            Submit.
          </h1>
          <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">
            Upload your assets. I'll handle the rest.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="group border-b border-zinc-800 focus-within:border-white transition-colors py-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Identifier</label>
            <input 
              name="clientName"
              required
              placeholder="YOUR NAME OR PROJECT"
              className="w-full bg-transparent outline-none text-xl font-bold uppercase placeholder:text-zinc-800"
            />
          </div>

          <div className="group border-b border-zinc-800 focus-within:border-white transition-colors py-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Instruction / Text Content</label>
            <textarea 
              name="content"
              rows="4"
              placeholder="WHAT GOES ON THE SITE?"
              className="w-full bg-transparent outline-none text-lg font-medium placeholder:text-zinc-800 resize-none"
            />
          </div>

          <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-500 transition-all p-8 flex flex-col items-center justify-center group cursor-pointer">
            <input 
              type="file" 
              name="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 mb-4 text-zinc-700 group-hover:text-white transition-colors" />
            <p className="text-sm font-bold tracking-tight text-zinc-500 group-hover:text-white">DRAG FILE OR CLICK TO BROWSE</p>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 uppercase tracking-[0.3em] hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Execute Submission"}
          </button>
        </form>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mt-8 flex items-center gap-3 text-green-500 font-bold uppercase text-sm tracking-widest">
            <CheckCircle size={18} /> Received. Moving to production.
          </div>
        )}
        {status === 'error' && (
          <div className="mt-8 flex items-center gap-3 text-red-500 font-bold uppercase text-sm tracking-widest">
            <AlertCircle size={18} /> Upload failed. Try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPortal;
