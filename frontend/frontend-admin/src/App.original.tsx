import { Toaster } from "sonner";
import { AdminRouter } from "./router/AdminRouter";

export function App() {
  return (
    <>
      <AdminRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
export default App;
