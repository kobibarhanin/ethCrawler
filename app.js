
MAX_RESULTS = 30;

async function getRelatedAddresses(address) {
    res = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${token}`)
    rv = await res.json();
    return rv;
}

async function populate(source) {

    rv = await getRelatedAddresses(source);
    
    eff_rv = rv.result.slice(0, MAX_RESULTS);

    nodesSet = new Set();   
    eff_rv.forEach((item, index)=>{
      nodesSet.add(item.from);
      nodesSet.add(item.to);
    })

    nodesData = []
    nodesSet.forEach((item, index)=>{
      nlabel = item.slice(0,5);
      if (known_addresses[item] !== undefined) {
        nlabel = known_addresses[item];
      }
      nodesData.push({ id: item, label: nlabel})
    })

    var nodes = new vis.DataSet(nodesData);

    edgesData = []
    eff_rv.forEach((item, index)=>{
      edgesData.push({ from:item.from, to: item.to, arrowhead:'normal'});
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
      edges: {
        arrows: 'to' 
      },
      layout: {
        hierarchical: {
          direction: 'UD',
        }
      }
    };
    var network = new vis.Network(container, data, options);

    // to create click events
    network.on("click", function (params) {
      console.log(params);
      populate(params.nodes[0]);
    });
}

$("#source_button").click(function(){
    event.preventDefault();
    var address = $("#source_address").val();
    populate(address);
});


populate(default_source);