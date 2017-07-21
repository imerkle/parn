String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
const fixJson = (myjson) => {
    const crappyJSON = myjson;
    const fixedJSON = crappyJSON.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
    return JSON.parse(fixedJSON);
}
const regexReplace = (str, regex, replace) => {
    return str.replace(regex, replace);
}

export const atomPrefix = "obrj51zz5B6EIPzxT4F0z37iUDzt5ul9LAoGX0bJ";
export const noVersionString = "VRPb78vrp0H3iryXZvjETSuLvKszTbzl1HaEnB3D";

const elixirToJS = (str) => {
    str = regexReplace(str, /:(\w{1,100})[,\s*] \b/g, ':$1, "' + noVersionString + '", ');
    str = regexReplace(str, /(^|[^:\w]):(\w{1,100})[,|, ]/g, '$1\"$2\": ');
    str = regexReplace(str, /(^|[^:\w]):(\w{1,100})/g, '$1\"' + atomPrefix + '$2\" ');

    str = regexReplace(str, /(\w{1,100}):/g, '\"$1\":');

    return str;

}


const jsToElixir = (strout) => {

    strout = regexReplace(strout, /{"(\w{1,100})":/g, '{:$1, ');
    strout = regexReplace(strout, /"(\w{1,100})":/g, '$1: ');
    strout = regexReplace(strout, new RegExp('"' + atomPrefix + '(\\w{1,100})"', "g"), ' :$1');
    strout = strout.replaceAll("},", "},\n\t\t");
    strout = strout.replaceAll('"' + noVersionString + '",', "");
    return strout;
}



export const parn = ({
    str,
    newUpdatedOnes = [],
    deleteEmLads = []
}) => {


    str = str.trim();
    let new_str = str.replace("\n", " ").trim();


    const f1 = "defp deps do";
    const f2 = "end";

    const cutabove = str.substring(str.lastIndexOf(f1) + f1.length);
    let initialPackage = cutabove.substring(0, cutabove.indexOf(f2));
    const cutbelow = "\t" + cutabove.substring(cutabove.indexOf(f2));

    const stripComments = /#{:(.*?(\n))/g;
    const commentLines = (initialPackage.match(stripComments)) || [];

    initialPackage = initialPackage.replace(stripComments, "");
    let smain = elixirToJS(initialPackage);
    let packageObject = fixJson(smain);
    let replacedPackagesIndex = [];
    let packageObject_tmp = [];
    newUpdatedOnes.map((o, i) => {
        const k = Object.keys(o)[0];
        let replaced = false;
        packageObject.map((ox, ix) => {
            if (!replaced && k == Object.keys(ox)[0]) {
            		if(JSON.stringify(packageObject[ix]) != JSON.stringify(o)){
            		   replacedPackagesIndex.push(i);
            		}
                Object.assign(packageObject[ix],o);
                replaced = true;
            }
        });
        if (!replaced) {
            packageObject_tmp.push(o);
 	          replacedPackagesIndex.push(i);
        }
    });
    packageObject = packageObject.concat(packageObject_tmp);
    
    deleteEmLads.map((o, i) => {
        const k = o;
        let deleted = false;
        packageObject.map((ox, ix) => {
            if (!deleted && k == Object.keys(ox)[0]) {
                packageObject.splice(ix, 1);
                deleted = true;
                replacedPackagesIndex.push(i);
            }
        });
    });

    let finalPackages = JSON.stringify(packageObject);
    finalPackages = "\t\t" + jsToElixir(finalPackages) + "\n\n" + "\t\t" + commentLines.join("\t\t");


    let finalWriteOutput = "";
    finalWriteOutput += [str.substring(0, str.lastIndexOf(f1) + f1.length), finalPackages, cutbelow].join("\n");

    return {output: finalWriteOutput, modifiedIndex: replacedPackagesIndex};
}
