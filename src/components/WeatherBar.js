import React from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import withRoot from '../withRoot';


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
    height:"100%"
  },
  row:{
    display:"flex",
    flexDirection:"row",
    justifyContent:"space-between"
  },
  column:{
    display:"flex",
    flexDirection:"column",
    justifyContent:"space-around",
    alignItems:"space-around",
    flex: 1,
  }
});


class WeatherBar extends React.Component {
  state = {
    weatherData: this.props.weatherData
  }

  componentDidUpdate(prevProps){
    if(prevProps.weatherData !== this.props.weatherData)this.setState({weatherData: this.props.weatherData})
  }

  render() {
    const { classes } = this.props;
    const { weatherData } = this.state

    return (
      <div className={classes.root} >
        <Grid container justify="space-between">
          {
            weatherData && weatherData.hourly.data.map((data, i)=>{
              let timestamp = new Date(parseInt(data.time)*1000)
              if( moment(timestamp).isSameOrAfter(Date.now()) && moment(timestamp).isSameOrBefore(moment(Date.now()).add(1,'day')) && moment(timestamp).hour()%3===0){
                return(
                  <Grid  item md={1} key={i} className={classes.column}>

                      <Typography variant="h5" align="center">{moment(timestamp).format('HH:mm')}</Typography>

                      <Typography variant="h4" align="center">
                        {
                          Math.floor((data.temperature-32)/(9/5))
                        }&deg;C
                      </Typography>
                      <div style={{textAlign:"center", fontSize:30}}>
                        {
                          Object.keys(weatherIconMap).map((key, i)=>{
                            if(key === data.icon){
                              return(
                                <i key={i} className={weatherIconMap[key]}></i>
                              )
                            }
                          })
                        }
                      </div>
                  </Grid>
                )
              }
            })
          }
        </Grid>

      </div>
    );
  }
}

WeatherBar.propTypes = {
  classes: PropTypes.object.isRequired,

};

export default withRoot(withStyles(styles)(WeatherBar));
