const scrapeIt = require("scrape-it");
import {atomPrefix, noVersionString, parn} from './regx.js';
import chalk from 'chalk';
const log = console.log;
const pjson = require('./package.json');
const PKNAME = 'parn';
const findUp = require('find-up');
const fs = require('fs');
var spawn = require('child_process').exec;



String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};
const readTextFile = (file, callback) => {
   fs.readFile(file, 'utf8', callback);
}
const writeTextFile = (file, content, callback = (err)=>{ if(err) println({str: err, type: "error"}); }) => {
   fs.writeFile(file, content, callback);
}
let count = 0;
const base_url = 'https://hex.pm/packages/';
let packageList = [];
let package_names_global;
let packageError = [];
let opts_global;
let startTime = new Date();
let mixFileText = "";
let filepath_global = "";

const secondsElapsed = () => {
   return ( ( (new Date() - startTime) / 1000) % 60 ).toFixed(1);
};
const totalSteps = 5; 

const headingPrint = () => {
  println({str:`${PKNAME} v${pjson.version}`,type: 'heading'});	
}
const addPackage = (package_names, opts) => {
 package_names_global = package_names;
 opts_global = opts;
 headingPrint();
 println({str: 'Finding Mix.exs...',type: 'step',step : {now: 1}});

 findUp('mix.exs').then(filepath => {
    filepath_global = filepath;
    if(filepath){
        readTextFile(filepath, (err, data)=>{
          if(err){
            	println({str: err, type: 'error'});	
          }else{
          	if(data.length > 0){
                  mixFileText = data;
     	  	  println({str: 'Searching packages...',type: 'step',step : {now: 2}});
  	  	  const package_name = package_names_global[count];
	  	  getPackage(package_name,pkg_callback);
	  	}else{
          	  println({str: `${filepath} is either empty`,type: 'error'});
          	}
     	  }
      });
    }else{
       println({str: 'No Mix.exs file found. Check again',type: 'error'});
    }	
 });
}
const noPkError = () => {
  println({str: `Cannot Fetch These Packages: ${packageError.join()}`, type:'error'});
  println({str: `${chalk.red("Total Errors: ")} ${chalk.bgRed(packageError.length)}`});
  println({str: `Done in ${secondsElapsed()}s with ${chalk.redBright(packageError.length)} errors`, type: "warn"});
}
const footerPrint = (type="success") => {
   println({str: `Done in ${secondsElapsed()}s`, type: type});
}
const pkg_callback = (err, result)=>{
   const package_name = package_names_global[count];
   let [pkg_name, suffix] = package_name.split("@");
   let currentPackage = {};
   if(!err && result.version){
     currentPackage = {[pkg_name]: result.version};
     if(opts_global.O) currentPackage["override"] = true;
     if(suffix == "umbrella"){currentPackage["in_umbrella"] = true}
     if(opts_global.D) {
  	currentPackage["only"] = `${atomPrefix}dev`
      } else if(opts_global.P){
	currentPackage["only"] = `${atomPrefix}prod` 
      }
     		
     packageList.push(currentPackage);
   }else{
     packageError.push(package_name);
   }
   count += 1;
   if(count < package_names_global.length){
     getPackage(package_names_global[count],pkg_callback);
   }else{
    if(packageError.length == package_names_global.length){
  	noPkError();
    }else{
    //end of fetching no more packages


      let chalkTy = "success";
      let parnObj = parn({str: mixFileText, newUpdatedOnes: packageList});
      	  mixFileText = parnObj.output;
      let modifiedIndex = parnObj.modifiedIndex;
      if(modifiedIndex.length < 1){
        println({str: `Nothing needed modified`, type: "warn"});
	footerPrint();
      }else{

      println({str: 'Creating Backup....',type: 'step',step : {now: 3}});
      const onlyPath = filepath_global.substring(0, filepath_global.lastIndexOf("/")) + "/.parn_exs/";	
      spawn(`mkdir -p ${onlyPath}`,(error, stdout, stderr)=>{
	  writeTextFile(`${onlyPath}mix.exs.${startTime.getTime()}.bk`, mixFileText);
      });
	     
      println({str: 'Linking packages...',type: 'step',step : {now: 4}});
      writeTextFile(filepath_global, mixFileText,(err)=>{

	println({str: 'Downloading packages...',type: 'step',step : {now: 5}});
        spawn("mix deps.get",(error, stdout, stderr) => {
            if(stdout) println({str: stdout, type: "info"});
            if(error) { println({str: error, type: "error"}); chalkTy = "warn";}
	       if(err){
		   println({str: err,type: 'error'});
		}else{
		      if(packageError.length > 0){
			noPkError();	
		      }else{
                        if(!error){ 
			   const addedPackages = modifiedIndex.map((o)=>{ return package_names_global[o]});
 			   if(addedPackages.length > 0) println({str: chalk.bgMagenta.bold(`Packages Installed`)});; 
 			   addedPackages.map((o)=>{
				println({str: chalk.magentaBright(`|_${o}`)});
			   });
 			   console.log("\n");	
			}
                        footerPrint(chalkTy);
		      }
		}
	    });
	});
      }
    }
   }
 }
const getPackage = (package_name, callback) => {
  let [pkg_name, suffix] = package_name.split("@");
  if(suffix == "umbrella"){
	callback(null,{version: noVersionString});
  }else{
        let [pkg_name_url, exact] = (suffix == "latest" || suffix == "stable" || !suffix) ? [pkg_name, false] : [`${pkg_name}/${suffix}`, true];   

 	 const url = base_url + pkg_name_url;
	  scrapeIt(url, {
	      stable_version: {
		 selector: "#mix-snippet",
		 convert: x => {
                     if(!x){ return x}
		     let replaced = x.replace(/{:(\w{1,100})[,\s*]/g,'');
		         replaced = replaced.substring(0,replaced.length-1).trim();
		     return replaced.replaceAll("\"","");
		 },
		 how: "val"
	      },
              exact_version: {
                selector: '.package-view > .package-title > .version',
		 convert: x => {
                     if(!x){ return x}
		     return `~> ${x}`;
		 },
              },
	      latest_version: {
		 selector: '#versions > li:first-child > a > strong',
		 convert: x => {
                     if(!x){ return x}
		     return `~> ${x}`;
		 },
	      }
	  }).then( (result, err) => {
	      const version = (suffix == "latest") ? result.latest_version : ( (exact) ? result.exact_version : result.stable_version );
	      callback(err, {version: version});
              
	  });
 }
}
const println = ({str, type, step}) => {
 switch(type){
   case 'info':
     log(chalk.gray.bold(str));
   break;
   case 'heading':
     log(chalk.whiteBright.bold(str));
   break;
   case 'step':
     log(chalk.gray(`[${step.now}/${step.total || totalSteps}]`), chalk.magentaBright(str));
   break;
   case 'success':
     log(chalk.bgGreen("success"), chalk.green.bold(str));
   break;
   case 'error':
     log(chalk.bgRed("error"), chalk.red(str));
   break;
   case 'warn':
      log(chalk.bgYellow("warn"), chalk.gray(str));
   break;
   default:
     log(str); 
   break;
 }
}

const hexRunner = (command, callback= ()=>{}) => {
  spawn(command,(error, stdout, stderr) => {
    if(stdout) println({str: stdout, type: "info"});
    if(error) { println({str: error, type: "error"}); chalkTy = "warn";}
    callback();
  });
}
const removePackage = (packageNames) => {
   headingPrint();
   hexRunner(`mix deps.clean ${packageNames.join(" ")}`, () => { footerPrint() });
}
export {addPackage, removePackage};
  
