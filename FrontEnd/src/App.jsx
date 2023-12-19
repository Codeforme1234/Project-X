import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from './Pages/LoginPage'
import ErrorPage from './Pages/ErrorPage'

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route index element={<LoginPage/>}/>
        <Route path='/LoginPage' element={<LoginPage/>}/>
        <Route path='*' element={<ErrorPage/>}/>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
