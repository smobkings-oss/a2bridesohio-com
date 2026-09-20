export const finishedRide = (status:string)=>['Completed','Canceled'].includes(status);
export function passengerRide(ride:any){
  return finishedRide(ride.status)?{id:ride.id,archived:true}:ride;
}

export function driverRide(ride:any){
  if(finishedRide(ride.status))return{id:ride.id,archived:true};
  if(ride.status==='Assigned'){
    const{name:_name,notes:_notes,...safe}=ride;
    return safe;
  }
  return{...ride,name:ride.name?.trim().split(/\s+/)[0]};
}
