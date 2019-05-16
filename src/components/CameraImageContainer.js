import React, {useRef, useEffect } from 'react';
import jsmpeg from 'jsmpeg'


const CameraImageContainer = ()=>{
  const canvasRef = useRef(null);

  useEffect(()=>{
    let client = new WebSocket('ws://localhost:9999')
    canvasRef.current.style.width = "70vw"
    canvasRef.current.style.height = "100vh"
    let player = new jsmpeg(client, {
      canvas: canvasRef.current, // Canvas should be a canvas DOM element
      videoBufferSize : 512*1024*4
    })

    return ()=> client.close()
  })


  return(
    <div style={{height: "100%",display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding: 32}}>

      <canvas ref={canvasRef} width="100%" height="100%"></canvas>

    </div>
  )
}

export default CameraImageContainer
