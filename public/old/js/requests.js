$(document).ready(function(){
    var incoming = CF.getJsonFromUrl();
    var e_filter = $('.fc-control[data-filter="event"]');
    var ep_filter = $('.fc-control[data-filter="event_part"]');
    var incE = incoming.event_id;
    var incEp = incoming.part_id;
    //console.log(e_filter.select2('data').id, ep_filter);
    e_filter.select2('val', incoming.event_id);
    ep_filter.select2('val', incoming.part_id);
    console.log(incoming);
});
