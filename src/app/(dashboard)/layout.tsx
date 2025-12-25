import { Sidebar } from "@/components/layout";

export default function DashboardLayout({
     children,
 }: {
     children: React.ReactNode;
 }) {
     return (
         <div className="flex min-h-screen bg-background">
             <Sidebar />
             <main className="flex-1 overflow-auto">
                 <div className="container mx-auto p-6 lg:p-8">
                     {children}
                 </div>
             </main>
         </div>
     );
 }
