export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#1E3A8A] text-white py-12 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white flex items-center justify-center rounded-sm overflow-hidden">
              <img 
                src="/src/assets/images/adharchand_torch_logo_1779037415571.png" 
                alt="Adharchand HS School Logo" 
                className="w-full h-full object-contain scale-110"
              />
            </div>
            <h4 className="font-extrabold tracking-tight text-lg leading-tight">Adharchand Higher Secondary School</h4>
          </div>
          <p className="text-sm opacity-70 leading-relaxed">
            Dedicated to academic excellence and character building since 1940. Nurturing the leaders of tomorrow with a heritage of tradition and vision for the future.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-6">Contact Us</h4>
          <address className="not-italic text-sm space-y-3 opacity-80">
            <p>123 Education Square,</p>
            <p>Heritage Road, City Center</p>
            <p>Phone: +1 (555) 0123-4567</p>
            <p>Email: contact@adharchandhss.in</p>
            <p>Website: <a href="https://www.adharchandhss.in" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#B45309] font-bold">www.adharchandhss.in</a></p>
          </address>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-6">Quick Links</h4>
          <ul className="text-sm space-y-2 opacity-80">
            <li><a href="/about" className="hover:underline">About Our Heritage</a></li>
            <li><a href="/admission" className="hover:underline">Apply for 2024-25</a></li>
            <li><a href="/notice" className="hover:underline">Academic Calendar</a></li>
            <li><a href="/calendar" className="hover:underline">School Events Timeline</a></li>
            <li><a href="/faculty" className="hover:underline">Our Faculty</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-6">School Hours</h4>
          <div className="text-sm space-y-1 opacity-80">
            <p className="font-bold">Mon - Fri: 08:00 - 14:30</p>
            <p>Saturday: 08:00 - 12:00</p>
            <p className="text-xs mt-4 italic opacity-60">*Closed on Sundays and Public Holidays</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-8 flex flex-col md:row justify-between items-center gap-4 text-[10px] uppercase tracking-widest opacity-40">
        <p>© {currentYear} Adharchand Higher Secondary School. All Rights Reserved.</p>
        <p>Managed by Adharchand Educational Trust</p>
      </div>
    </footer>
  );
}
