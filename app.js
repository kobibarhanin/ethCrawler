// from config.js: KNOWN_ADDRESSES, DEFAULT_SOURCE, TOKEN, MAX_RESULTS 
address = DEFAULT_ADDRESS
total_txs = [];

// verify token is valid
ready = true;
if (typeof TOKEN === 'undefined' || TOKEN === ''){
  ready = false;
}

class GNode {
  constructor(item) {
    this.id = item
    this.title = item
    this.shape = 'image' 
    if (KNOWN_ADDRESSES[item]) {
      this.label = KNOWN_ADDRESSES[item]['title'];
      this.image = `./assets/${KNOWN_ADDRESSES[item]['type']}.png`
    } else {
      this.label = item.slice(0,5);
      this.image = `./assets/unknown.png`        
    }
  }
}

class GEdge {
  constructor(item) {
    this.id = item.hash 
    this.from = item.from 
    this.to = item.to
    this.title = item.hash
    this.arrowhead = 'normal' 
   }
}


function get_nodes(txs){
  nodesSet = new Set();   
  txs.forEach((item, index)=>{
    nodesSet.add(item.from);
    nodesSet.add(item.to);
  })
  return nodesSet;
}

async function getFromEtherScan(action, address) {
  res = await fetch(`https://api.etherscan.io/api?module=account&sort=asc&apikey=${TOKEN}&action=${action}&address=${address}`)
  rv = await res.json();
  return rv;
}

function toggle_info_display(on, off){
  $("#"+on).show();
  $("#"+off).hide();
}

function wei_to_eth(wei){
  return wei/1000000000000000000;
}

function chunkify(array){
  var i,j,chunk = MAX_RESULTS;
  rv = [];
  for (i=0,j=array.length; i<j; i+=chunk) {
    rv.push(array.slice(i,i+chunk));
  }
  return rv
}

async function update_table(source, balance, txs, tx){
  if (tx == null){
    toggle_info_display("address_display", "tx_display");

    $("#address_table").empty();
    $("#txs_table").empty();

    $("#address_table").append("<tr><td>Address</td><td>" + source + "</td></tr>");
    $("#address_table").append("<tr><td>Balance</td><td>" + wei_to_eth(parseInt(balance)) + "</td></tr>");  

    for (var i = 0; i < txs.length; i++){
      $("#txs_table").append(`<tr><td>${txs[i]['hash']}</td></tr>`);  
    }
  } else {
    toggle_info_display("tx_display", "address_display");
    $("#tx_table").empty();
    for (var i = 0; i < txs.length; i++){
      tx_data = txs[i];
      if (tx_data['hash'] == tx){
        for (var key in tx_data){
          $("#tx_table").append(`<tr><td class="four wide">${key}</td><td>${tx_data[key]}</td></tr>`);  
        }
        break;
      }
    }
  }
}

async function generate_graph(nodes, edges){
    
    var container = document.getElementById("network_graph");
    var data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges),
    };
    var options = {
      nodes: {font: { color: "#eeeeee" }},
      interaction: { 
        hover: true,     
        navigationButtons: true,
      },
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
    network.on("click", async function (params) {
      if (params.nodes.length > 0){
        address = params.nodes[0];
        populate(address);
      } 
      else if (params.edges.length > 0){
        txs_call = await getFromEtherScan('txlist',address);
        txs = txs_call.result.slice(0, MAX_RESULTS);
        update_table(null,null,txs, params.edges[0])
      }
    });
}

async function populate(address, tx=null) {

    txs_call = await getFromEtherScan('txlist',address);
    txs = txs_call.result.slice(0, MAX_RESULTS);
    total_txs = chunkify(txs_call.result);
    // TODO - continue here the results paging issue
    if (total_txs.length > 1){
      $("#more_results").show();
    }
    
    balance_call = await getFromEtherScan('balance',address);
    balance = balance_call.result;

    update_table(address, balance, txs, tx);

    nodes = []
    get_nodes(txs).forEach((item)=>{
      nodes.push(new GNode(item))
    })

    edges = []
    txs.forEach((item)=>{
      edges.push(new GEdge(item));
    })

    generate_graph(nodes, edges);
}


jQuery(function(){
  
  if (ready !== true){
    $("#network_graph").hide();
    $("#info_display").hide();
    $("#source_form").after(`
    <div class="ui warning message">
    <div class="header">
      No valid TOKEN defined in config.js
    </div>
      Visit https://etherscan.io/myapikey to generate a token.
    </div>
    `)
  }
  else{
    $("#source_form").on("submit", function(){
      event.preventDefault();
      $("#info_display").show();
      populate($("#source_address").val());
    });
  
    if (address === ''){
      $("#info_display").hide();
    } else{
      $("#more_results").hide();
      populate(address);
    }
  }
});
  
  
