// from config.js: KNOWN_ADDRESSES, DEFAULT_SOURCE, TOKEN, MAX_RESULTS 


async function getFromEtherScan(action, address) {
  res = await fetch(`https://api.etherscan.io/api?module=account&sort=asc&apikey=${TOKEN}&action=${action}&address=${address}`)
  rv = await res.json();
  return rv;
}


async function populate(source, tx=null) {

    rv = await getFromEtherScan('txlist',source);
    txs = rv.result;
    eff_rv = rv.result.slice(0, MAX_RESULTS);

    
    balance = await getFromEtherScan('balance',source);

    $("#address_table").empty();
    if (tx == null){
      $("#address_display").show()
      $("#tx_display").hide()

      $("#address_table").append("<tr><td>Address</td><td>" + source + "</td></tr>");
      $("#address_table").append("<tr><td>Balance</td><td>" + parseInt(balance.result)/1000000000000000000 + "</td></tr>");  
      $("#context_data").val(JSON.stringify(txs, null, 4))
      $("#txs_table").empty();
      for (var i = 0; i < eff_rv.length; i++){
            $("#txs_table").append(`<tr><td>${eff_rv[i]['hash']}</td></tr>`);  
      }
    } else {
      $("#address_display").hide()
      $("#tx_display").show()
      $("#tx_table").empty();
      for (var i = 0; i < eff_rv.length; i++){
        tx_data = eff_rv[i];
        if (tx_data['hash'] == tx){
          for (var key in tx_data){
            $("#tx_table").append(`<tr><td class="four wide">${key}</td><td>${tx_data[key]}</td></tr>`);  
          }
          break;
        }
      }
    }

    nodesSet = new Set();   
    eff_rv.forEach((item, index)=>{
      nodesSet.add(item.from);
      nodesSet.add(item.to);
    })

    nodesData = []
    nodesSet.forEach((item, index)=>{
      label = item.slice(0,5);
      image = ''
      if (KNOWN_ADDRESSES[item] !== undefined) {
        label = KNOWN_ADDRESSES[item]['title'];
        type = KNOWN_ADDRESSES[item]['type'];
        image = `./assets/${type}.png`
      } else {
        image = `./assets/unknown.png`        
      }
      nodesData.push({ id: item, label: label, title: item, image: image, shape: 'image'})
    })

    var nodes = new vis.DataSet(nodesData);

    edgesData = []
    eff_rv.forEach((item, index)=>{
      edgesData.push({ id:item.hash, from:item.from, to: item.to, arrowhead:'normal', title: item.hash});
    })

    // create an array with edges
    var edges = new vis.DataSet(edgesData);

    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
      nodes: nodes,
      edges: edges,
    };
    var options = {
      nodes: {
        // shape: 'box',
        font: { color: "#eeeeee" },
      },
      interaction: { hover: true },
      // manipulation: { enabled: true },
      physics: {
        barnesHut: { gravitationalConstant: -30000 },
        stabilization: { iterations: 2500 },
      },
      edges: {
        length: 300,
        arrows: 'middle' 
      },
      layout: {
        randomSeed: undefined,
        improvedLayout:true,
        clusterThreshold: 150,
      }
    };
    network = new vis.Network(container, data, options);
    
    network.once('afterDrawing', () => {
      container.style.height = '100vh'
    })

    // to create click events
    network.on("click", function (params) {
      console.log(params);
      if (params.nodes.length > 0){
        source = params.nodes[0];
        populate(params.nodes[0]);
      } 
      else if (params.edges.length > 0){
        populate(source,params.edges[0]);
      }
    });

}


$("document").ready(function(){
  
  $("#source_form").submit(function(){
    event.preventDefault();
    var address = $("#source_address").val();
    populate(address);
  });

  populate(DEFAULT_SOURCE);

});
  
  
