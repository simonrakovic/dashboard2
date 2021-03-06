import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import withRoot from '../withRoot';
import CssBaseline from '@material-ui/core/CssBaseline';
import Clock from 'react-live-clock';
import DrawerContainerBottom from './../components/DrawerContainerBottom'
import DrawerContainer from './../components/DrawerContainer'
import WeatherBar from './../components/WeatherBar'

import Slide from '@material-ui/core/Slide'
import axios from 'axios'
import jsmpeg from 'jsmpeg'
import Fade from '@material-ui/core/Fade'

const weatherIconMap = {
  "clear-day":"wi wi-day-sunny",
  "clear-night":"wi wi-night-clear",
  rain: "wi wi-rain",
  snow: "wi wi-snow",
  sleet: "wi wi-sleet",
  wind: "wi wi-windy",
  fog: "wi wi-fog",
  cloudy: "wi wi-cloud",
  "partly-cloudy-day": "wi wi-day-cloudy",
  "partly-cloudy-night": "wi wi-night-alt-cloudy"
}

const styles = theme => ({
  root: {
    display:"flex",
    height: "100vh",
    overflow: "hidden"
  },

  clock:{
    padding: theme.spacing.unit * 1,
    margin: theme.spacing.unit * 2,
    fontSize: 120,
    borderBottom: "4px solid "+theme.palette.primary.main
  },

  row:{
    display:"flex",
    flexDirection:"row",
    justifyContent:"space-between"
  },

  column:{
    position:"relative",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"space-around",
    flex: 1,
  },
});



class Index extends React.Component {
  state = {
    navigationDrawerState: false,
    cameraDrawerState: false,
    weatherDrawerState: true,
    weatherData: null,
    closeCameraDrawerFunction: null
  };

  componentDidMount(){

    let eventSource = new EventSource('/api/camera/alarm/stream');
    eventSource.onmessage = message => {
      let data = JSON.parse(message.data)

      let closeCameraDrawerFunction = this.state.closeCameraDrawerFunction
      console.log("cameraActive1", data, this.state.cameraDrawerState)
      if(data.active && !this.state.cameraDrawerState){
        console.log("cameraActive2")
        this.setState({cameraDrawerState: true,  weatherDrawerState: false},()=>{
          if(closeCameraDrawerFunction) clearInterval(closeCameraDrawerFunction)
          let funId = setTimeout(()=>{
            console.log("cameraActive3", closeCameraDrawerFunction)
            this.setState({cameraDrawerState:false, weatherDrawerState: true})
            clearInterval(closeCameraDrawerFunction)
          },15000)
          this.setState({closeCameraDrawerFunction: funId})
        })

      }

    };

    this.getWeatherData()
    setInterval(()=>{this.getWeatherData()},300000)


    let client = new WebSocket('ws://localhost:9999')
    this.canvas.style.width = "100%"
    this.canvas.style.height = "800px"
    let player = new jsmpeg(client, {
      canvas: this.canvas, // Canvas should be a canvas DOM element
      videoBufferSize : 512*1024
    })


  }

  getWeatherData(){
    axios.get('/api/weather')
	  .then( (response) => {

      this.setState({weatherData: response.data})
	  })
	  .catch(function (error) {
	    console.log(error);
	  });
  }

  toggleNavigationDrawer = ()=>{
    this.setState({navigationDrawerState: !this.state.navigationDrawerState, weatherDrawerState: !this.state.weatherDrawerState})

  }

  toggleCameraDrawer = ()=>{
    this.setState({cameraDrawerState: !this.state.cameraDrawerState,  weatherDrawerState: this.state.cameraDrawerState})

  }

  render() {
    const { classes } = this.props;
    const { navigationDrawerState, cameraDrawerState, weatherData, weatherDrawerState } = this.state;

    return (
      <div className={classes.root} onClick={this.toggleCameraDrawer}>
        <div style={{flex: 1, display:"flex", flexDirection:"column",height: "100%"}}>
          <div style={{flex: 1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center"}}>
            <Typography style={cameraDrawerState ? {fontSize: 100, fontWeight: 400} : null}  className={classes.clock} variant="h1">
              <Clock format={'HH:mm'} ticking={true} timezone={'Europe/Vienna'} />
            </Typography>

              {
                cameraDrawerState && (
                  <div  className={classes.column}>

                    <Typography variant="h1" align="center" style={{fontWeight: 400, padding: 32}}>
                      {
                        weatherData && Math.floor((weatherData.currently.temperature-32)/(9/5))
                      }&deg;C
                    </Typography>
                    <div style={{textAlign:"center", fontSize: 110,}}>
                      {
                        Object.keys(weatherIconMap).map((key, i)=>{
                          if(weatherData && key === weatherData.currently.icon){
                            return(
                              <i key={i} className={weatherIconMap[key]}></i>
                            )
                          }
                        })
                      }
                    </div>
                  </div>
                )
              }

          </div>
          <DrawerContainerBottom anchor="bottom" height={200} open={weatherDrawerState}>
            <WeatherBar weatherData={weatherData}/>
          </DrawerContainerBottom>



        </div>
        <DrawerContainer open={cameraDrawerState}>
          <div style={{height: "100vh",display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",  overflow: "hidden"}}>

            <canvas ref={(ref)=> {this.canvas = ref}} width="100%" height="100vh"></canvas>

          </div>
        </DrawerContainer>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withRoot(withStyles(styles)(Index));
