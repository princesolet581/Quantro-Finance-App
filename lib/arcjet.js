
import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({ 
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"],

  
  rules:[
   tokenBucket({
    mode:"LIVE",
    refillRate: 2, // tokens added per second
    capacity: 2, 
    interval:3600 // maximum burst

  }),
]
});

export default aj;
