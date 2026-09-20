export const finishedRide = (status:string)=>['Completed','Canceled'].includes(status);
export function passengerRide(ride:any){
  return finishedRide(ride.status)?{id:ride.id,archived:true}:ride;
}
