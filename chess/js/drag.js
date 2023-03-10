
$(document).on('mousedown', '.Piece', function(e) {
    if(UserMove.from === SQUARES.NO_SQ) {
        UserMove.from = ClickedSquare(e.pageX, e.pageY);
        if($('#pieceDragged').length === 0){

            $(this).clone().appendTo('#Board').css('z-index', 1000).prop('id', 'pieceDragged')
        }
    }
    else {
//        if(UserMove.to != SQUARES.NO_SQ){
//
//        }
        UserMove.to = ClickedSquare(e.pageX, e.pageY);
        if(ParseMove(UserMove.from,UserMove.to) != NOMOVE){
            MakeUserMove();
        }
        else{
            DeselectSq(UserMove.from);
            UserMove.from = ClickedSquare(e.pageX, e.pageY)
            UserMove.to = SQUARES.NO_SQ;


        }
    }
})
$(document).on('mousemove', function(e) {
    var position = $("#Board").position();
    //console.log("Piece clicked at " + pageX + "," + pageY + " board top:" + position.top + " board left:" + position.left);

    var workedX = Math.floor(position.left);
    var workedY = Math.floor(position.top);
    var pageX = Math.floor(e.pageX);
    var pageY = Math.floor(e.pageY);
    console.log(window.devicePixelRatio*100)
    if(window.screen.width < 1440 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }
    else if(window.screen.width == 1920 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }

    $('#x').text(e.pageX)
    $('#y').text(e.pageY)
    var piece = $('#pieceDragged')
    //  console.log( Math.floor(pageX-workedX))
    piece.css('left',  Math.floor((pageX-workedX-30)) + 'px')
    piece.css('top', Math.floor((pageY-workedY-30)) + 'px')
})
$(document).on('mouseup', function(e) {
    if(!IS_EDIT){
        if(UserMove.from != SQUARES.NO_SQ && UserMove.from != ClickedSquare(e.pageX, e.pageY)){
            UserMove.to = ClickedSquare(e.pageX, e.pageY);
            MakeUserMove();

            //$(this).clone().appendTo('#Board').css('z-index', 1000).prop('id', 'pieceDragged')
        }

        $('#pieceDragged').remove()
    }
    else{
        var square = ClickedSquare(e.pageX, e.pageY);
        var sq = UserMove.from
        if(square){
            AddPiece(square, DRAGGED_PIECE_EDIT)
            ClearPiece(sq)
            if(GameController.BoardFlipped == BOOL.TRUE){
                square = MIRROR120(square)
                sq = MIRROR120(sq)
            }
            RemoveGUIPiece(sq)
            RemoveGUIPiece(square)
            AddGUIPiece(square, DRAGGED_PIECE_EDIT)
            //CheckAndSet()
            DRAGGED_PIECE_EDIT = 0

            //GenerateCaptures()
            //GenerateMoves()
            //GeneratePosKey()
            //CheckBoard()
            //ResetBoard()
            brd_after_edit(brd_pieces)
            UserMove.from = SQUARES.NO_SQ;
		    UserMove.to = SQUARES.NO_SQ;
            $('#pieceEditDragged').remove()
        }
        else{
            ClearPiece(sq)
            if(GameController.BoardFlipped == BOOL.TRUE){
                square = MIRROR120(square)
                sq = MIRROR120(sq)
            }
            RemoveGUIPiece(sq)
            RemoveGUIPiece(square)
            //CheckAndSet()
            //SetInitialBoardPieces()
            //console.log(brd_pieces)
            DRAGGED_PIECE_EDIT = 0
            $('#pieceEditDragged').remove()
        }
        PrintBoard()
        $('.game').removeClass('clickElement')
    }

})
function brd_after_edit(brd_pieces){
    for(var i = 0; i<brd_pieces.length;i++){
        if(i <= 20){
            brd_pieces[i] = SQUARES.OFFBOARD
        }
        if(i >= 100){
            brd_pieces[i] = SQUARES.OFFBOARD
        }
        if(i % 10 == 0 || i % 10 == 9){
            brd_pieces[i] = SQUARES.OFFBOARD
        }
    }
}

$(document).on('mousedown', '.piece-edit', function(e) {
    UserMove.from = ClickedSquare(e.pageX, e.pageY);
    $(this).clone().appendTo('body').css('z-index', 1000).prop('id', 'pieceEditDragged')
    DRAGGED_PIECE_EDIT = $(this).attr('data-id')
    $('.SqSelected').removeClass('SqSelected')

    console.log(DRAGGED_PIECE_EDIT)
})
$(document).on('mousemove', function(e) {
    var position = $("#Board").position();
    //console.log("Piece clicked at " + pageX + "," + pageY + " board top:" + position.top + " board left:" + position.left);

    var workedX = Math.floor(position.left);
    var workedY = Math.floor(position.top);
    var pageX = Math.floor(e.pageX) - 30;
    var pageY = Math.floor(e.pageY) - 30;
    if(window.screen.width < 1440 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }
    else if(window.screen.width == 1920 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }


    $('#x').text(e.pageX)
    $('#y').text(e.pageY)
    var piece = $('#pieceEditDragged')
    //  console.log( Math.floor(pageX-workedX))
    piece.css('left',  pageX + 'px')
    piece.css('top', pageY + 'px')
})



