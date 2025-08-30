import './App.css'
import AppRouter from "./AppRouter";
import { BrowserRouter } from "react-router-dom";
import ApplicationProvider from "./context/ApplicationContext";
import { UserPermissionProvider } from "./context/UserPermissionContext";
import { Toaster } from "@/components/ui/sonner"

function App() {

  return (
    <>
      <ApplicationProvider>
        <UserPermissionProvider>
          <Toaster />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </UserPermissionProvider>
        </ApplicationProvider>
    </>
  )
}

export default App
