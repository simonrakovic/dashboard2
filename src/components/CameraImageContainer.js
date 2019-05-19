import React, {useRef, useEffect } from 'react';
import jsmpeg from 'jsmpeg'


const CameraImageContainer = ()=>{
  const canvasRef = useRef(null);

  useEffect(()=>{
    let client = new WebSocket('ws://localhost:9999')
    canvasRef.current.style.width = "100%"
    canvasRef.current.style.height = "800px"
    let player = new jsmpeg(client, {
      canvas: canvasRef.current, // Canvas should be a canvas DOM element
      videoBufferSize : 512*1024
    })

    return ()=> client.close()
  })


  return(
    <div style={{height: "100vh",display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",  overflow: "hidden"}}>

      <canvas ref={canvasRef} width="100%" height="100vh"></canvas>

    </div>
  )
}

export default CameraImageContainer
