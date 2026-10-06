import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function PublicContactPage() {
  const [formData, setFormData] = useState({
    sender_name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/contacts/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to submit form');
      }

      setSuccess(true);
      setFormData({ sender_name: '', email: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Know Your Leaders</title>
        <meta name="description" content="Get in touch with the Know Your Leaders team. We welcome your feedback, questions, and partnerships." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen pt-24 pb-24">
        <div className="bg-primary text-primary-foreground py-20 mt-[-6rem] mb-16 border-b border-emerald-800">
          <div className="container mx-auto px-4 text-center mt-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">Contact Us</h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Have questions, feedback, or want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Our Office</h4>
                      <p className="text-gray-500 mt-1">123 Democracy Way<br />Central Business District<br />Abuja, Nigeria</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Email Us</h4>
                      <p className="text-gray-500 mt-1">info@kyl.test</p>
                      <p className="text-gray-500">support@kyl.test</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Call Us</h4>
                      <p className="text-gray-500 mt-1">+234 (0) 800 123 4567</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                
                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <p className="font-medium">Thank you for reaching out! Your message has been sent successfully. We will get back to you soon.</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Your Name</label>
                      <Input 
                        required 
                        value={formData.sender_name}
                        onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                        placeholder="John Doe"
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <Input 
                        required 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="How can we help you today?"
                      className="min-h-[160px] rounded-xl border-gray-200"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full md:w-auto bg-[#146c4f] hover:bg-[#115a42] text-white rounded-xl px-8 py-6 h-auto text-lg font-bold transition-all"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending Message...</>
                    ) : (
                      <><Send className="w-5 h-5 mr-2" /> Send Message</>
                    )}
                  </Button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
