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

const styles = theme => ({
  root: {
    display:"flex",
    height: "100vh",

  },
});



class Index extends React.Component {
  state = {
    navigationDrawerState: false,
    cameraDrawerState: false,
    weatherDrawerState: true,
    weatherData: null
  };

  componentDidMount(){
    /*
    let eventSource = new EventSource('/api/camera/alarm/stream');
    eventSource.onmessage = message => {
      let data = JSON.parse(message.data)
      if(data.active && !this.state.cameraIsActive)this.toggleCamera()

    };
    */
    this.getWeatherData()
    setInterval(()=>{this.getWeatherData()},300000)
    //////////////////////////////////////////

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
            <Typography  variant="h1">
              <Clock format={'HH:mm'} ticking={true} timezone={'Europe/Vienna'} />
            </Typography>
          </div>
          <DrawerContainerBottom anchor="bottom" height={200} open={weatherDrawerState}>
            <WeatherBar weatherData={weatherData}/>
          </DrawerContainerBottom>


          <DrawerContainerBottom anchor="bottom" open={navigationDrawerState}>

          </DrawerContainerBottom>
        </div>
        <DrawerContainer open={cameraDrawerState}>

        </DrawerContainer>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withRoot(withStyles(styles)(Index));
