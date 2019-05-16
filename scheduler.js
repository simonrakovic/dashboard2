var nodeSchedule = require('node-schedule');
var moment = require('moment');

class Scheduler{
  constructor(schedules, fnStart, fnEnd){
    this.scheudledJobs = init(schedules, fnStart, fnEnd)
  }
}

function init(schedules, fnStart, fnEnd){
  var scheudledJobs = {}


  schedules.forEach((schedule)=>{
    var startTime = moment(schedule.start_time, 'HH:mm')
    var endTime = moment(schedule.start_time, 'HH:mm').add(schedule.duration, 'm')
      console.log(startTime.hours()+":"+startTime.minutes())
      console.log(endTime.hours()+":"+endTime.minutes())
    scheudledJobs[schedule.id] = {
                                  start_job: nodeSchedule.scheduleJob({hour: startTime.hours(), minute: startTime.minutes()}, ()=>fnStart()),
                                  end_job: nodeSchedule.scheduleJob({hour: endTime.hours(), minute: endTime.minutes()}, ()=>fnEnd())
                                }
  })
  return scheudledJobs
}

///////////////////////////////////// PROTOTYPES ///////////////////////////////////////77


Scheduler.prototype.startNewSchedule = function(newSchedule){
  var startTime = moment(newSchedule.start_time, 'HH:mm')
  var endTime = startTime.add(newSchedule.duration, 'm')
  this.scheudledJobs[newSchedule.id] = {
                                          start_job: nodeSchedule.scheduleJob({hour: startTime.hours(), minute: startTime.minutes()}, fnStart()),
                                          end_job: nodeSchedule.scheduleJob({hour: endTime.hours(), minute: endTime.minutes()}, fnEnd())
                                        }
}

Scheduler.prototype.cancleSchedule = function(scheduleId){
  if(this.scheudledJobs[scheduleId]){
    this.scheudledJobs[scheduleId].start_job.cancel()
    this.scheudledJobs[scheduleId].end_job.cancel()
  }
}

module.exports =  Scheduler;
