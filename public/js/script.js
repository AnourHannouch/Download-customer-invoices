/*
I am using the redirect uri:
http://localhost:3000/

and hosting using a small NODE express webserver
*/

window.onload = () => {
  
  //retreive the "code"
  document.getElementById("authbutton").onclick = () => {
    //store the variables
    const client_id = document.getElementById('clientid').value;
    const clientsecret = document.getElementById('clientsecret').value;
    const redirect_uri = document.getElementById('redirecturi').value;
    //localstorage
    localStorage.setItem("CID", client_id);
    localStorage.setItem("CS", clientsecret);
    localStorage.setItem("RURI", redirect_uri);
    //get the code (OAuth2)
    location.href = 
    "https://identity.vismaonline.com/connect/authorize?" +
    "client_id=" + client_id +
    "&redirect_uri=" + redirect_uri +
    "&state=abcde12345" +
    "&nonce=abcde12345" +
    "&scope=ea:api%20offline_access%20ea:sales" +
    "&response_type=code";
  }

  //"code" from URL fragment
  codef = () => {
    const qryString = window.location.search;
    const urlParam = new URLSearchParams(qryString);
    const code = urlParam.get('code');
    document.getElementById('Tcode').value = code;
  }
  codef();
  
  //Get the token (OAuth2)
  tokenf = () => {
    const http0 = new XMLHttpRequest();
    const CORSserver = "https://cors-anywhere.herokuapp.com/";
    const url = CORSserver + "https://identity.vismaonline.com/connect/token";
    http0.open("POST", url, true);
    http0.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    http0.setRequestHeader("Authorization", "Basic " + btoa(localStorage.getItem("CID") + ':' + localStorage.getItem("CS")));
    
    const data = "grant_type=authorization_code&code=" + document.getElementById('Tcode').value + "&redirect_uri=" + localStorage.getItem("RURI");
    http0.send(data);
  
    http0.onload = () => {
      const content = http0.response;
      const json = JSON.parse(content);
      document.getElementById("token").value = json["access_token"];
    }
  }
  if (document.getElementById('Tcode').value.length >=1) {
    tokenf();
  }

  //Get the invoices
  document.getElementById("GETbutton").onclick = () => {
    const CORSserver = "https://cors-anywhere.herokuapp.com/";
    //GET invoices id
    const getinvf = () => {
      const http1 = new XMLHttpRequest();
      const url = "https://eaccountingapi.vismaonline.com/v2/customerinvoices?$select=Id&$pagesize=200"; //change the number of invoices you want to download
      http1.open("GET", CORSserver + url, true);
      http1.setRequestHeader("Authorization", "Bearer " + document.getElementById("token").value);
      http1.setRequestHeader("Accept", "application/json");
      http1.send();
    
      http1.onload = () => {
        const content = http1.response;
        //const meta = JSON.parse(content)["Meta"];
        //map here... for meta
        //print them somewhere

        const data = JSON.parse(content)["Data"];
        const value = data.map(Id => Object.values(Id));

        for (i = 0; i < data.length; i++) {
          const table = document.getElementById("IItable");
          const row = table.insertRow(1);
          const cell1 = row.insertCell(0);
          cell1.innerHTML = value[i];
        };

        //GET PDF object url
        for (i = 0; i < data.length; i++) {
          const http2 = new XMLHttpRequest();
          const url = "https://eaccountingapi.vismaonline.com/v2/customerinvoices/" + value[i] + "/pdf";
          http2.open("GET", CORSserver + url, true);
          http2.setRequestHeader("Authorization", "Bearer " + document.getElementById("token").value);
          http2.setRequestHeader("Accept", "application/json");
          http2.send();
        
          http2.onload = () => {
            const pdflink = JSON.parse(http2.response)["Url"];
            const table = document.getElementById("URLtable");
            const row = table.insertRow(1);
            const cell2 = row.insertCell(0);
            cell2.innerHTML = pdflink;

            downloadpdf(pdflink);
          }
        }
      }
    }
    getinvf();
  
  const downloadpdf = (link) => {
    const http3 = new XMLHttpRequest();
    http3.open("GET", CORSserver + link, true);
    http3.responseType = "blob";
    http3.onload = () => {
      console.log("The status code is: " + http3.status);
      const data = http3.response;
      console.log(data);

      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      
      const filename = "my-invoice.pdf";
      const blob = new Blob([data], {type: "octet/stream"});
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    http3.send();
  }
  }
}