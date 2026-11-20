import { STORAGE_KEYS } from "./storage-keys";

export const DEV_MODE_PARAM = "dev";

export const devModeScript = `(function(){try{
var K="${STORAGE_KEYS.surveyMode}",A="${STORAGE_KEYS.analyticsMode}",u=new URL(location.href);
var d=u.searchParams.get("${DEV_MODE_PARAM}");
if(d!==null){
var on=d!=="0";
[K,A].forEach(function(k){if(on){localStorage.setItem(k,"false");}else if(k===K){localStorage.setItem(k,"true");}else{localStorage.removeItem(k);}sessionStorage.removeItem(k);});
u.searchParams.delete("${DEV_MODE_PARAM}");
history.replaceState(null,"",u.pathname+u.search+u.hash);
}
}catch(e){}})();`;
