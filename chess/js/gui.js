var global_x
var global_y
$(document).on('mousemove', function(e){
	global_x = e.pageX
	global_y = e.pageY
})
$(document).on('click','.color-queue', function(e){

    if(brd_side == COLOURS.WHITE){
        brd_side = COLOURS.BLACK
    }
    else{
        brd_side = COLOURS.WHITE
    }
    queue_slider()
})
function queue_slider(){

    if(brd_side == COLOURS.WHITE){
        $('.color-queue').val('0')
        $('.ball').css('background-color', 'white')
        $('.ball').css('transform', 'translateX(0px)')
    }
    else{
        $('.color-queue').val('1')
        $('.ball').css('background-color', 'black')
        $('.ball').css('transform', 'translateX(26px)')


    }

}

var UserMove = {};
UserMove.from = SQUARES.NO_SQ;
UserMove.to = SQUARES.NO_SQ;

var MirrorFiles = [ FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A ];
var MirrorRanks = [ RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1 ];

function MIRROR120(sq) {
	var file = MirrorFiles[FilesBrd[sq]];
	var rank = MirrorRanks[RanksBrd[sq]];
	return FR2SQ(file,rank);
}

$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val();
	ParseFen(fenStr);
	PrintBoard();
	SetInitialBoardPieces();
	GameController.PlayerSide = brd_side;
	CheckAndSet();
	EvalPosition();
	//PerftTest(5);
	newGameAjax();
});


function CheckResult() {

	if (brd_fiftyMove > 100) {
		$("#GameStatus").text("GAME DRAWN {fifty move rule}");
		return BOOL.TRUE;
	}

	if (ThreeFoldRep() >= 2) {
		$("#GameStatus").text("GAME DRAWN {3-fold repetition}");
		return BOOL.TRUE;
	}

	if (DrawMaterial() == BOOL.TRUE) {
		$("#GameStatus").text("GAME DRAWN {insufficient material to mate}");
		return BOOL.TRUE;
	}

	console.log('Checking end of game');
	GenerateMoves();

	var MoveNum = 0;
	var found = 0;

	for(MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum)  {
		if ( MakeMove(brd_moveList[MoveNum]) == BOOL.FALSE)  {
			continue;
		}
		found++;
		TakeMove();
		break;
	}

	$("#currentFenSpan").text(BoardToFen());

	if(found != 0) return BOOL.FALSE;
	var InCheck = SqAttacked(brd_pList[PCEINDEX(Kings[brd_side],0)], brd_side^1);
	console.log('No Move Found, incheck:' + InCheck);
	console.log(brd_pList[PCEINDEX(Kings[brd_side],0)])

	if(InCheck == BOOL.TRUE)	{
		if(brd_side == COLOURS.WHITE) {
			$("#GameStatus").text("GAME OVER {black mates}");return BOOL.TRUE;
		} else {
			$("#GameStatus").text("GAME OVER {white mates}");return BOOL.TRUE;
		}
	} else {
		$("#GameStatus").text("GAME DRAWN {stalemate}");return BOOL.TRUE;
	}
	console.log('Returning False');
	return BOOL.FALSE;
}

function ClickedSquare(pageX, pageY) {
	var position = $("#Board").position();
	console.log("Piece clicked at " + pageX + "," + pageY + " board top:" + position.top + " board left:" + position.left);

	var workedX = Math.floor(position.left);
	var workedY = Math.floor(position.top);
	var pageX = Math.floor(pageX);
	var pageY = Math.floor(pageY);
    if(window.screen.width < 1440 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }
    else if(window.screen.width == 1920 && window.devicePixelRatio*100 >= 150){
        pageX = pageX * 1.5
        pageY = pageY * 1.5
    }

	var file = Math.floor((pageX-workedX) / 60);
	var rank = 7 - Math.floor((pageY-workedY) / 60);
    // [0-7]
    if(file > 7 || file < 0 || rank > 7 || rank < 0){
        return false
    }
	var sq = FR2SQ(file,rank);


	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	console.log("WorkedX: " + workedX + " WorkedY:" + workedY + " File:" + file + " Rank:" + rank);
	console.log("clicked:" + PrSq(sq));

	SetSqSelected(sq); // must go here before mirror

	return sq;

}

function CheckAndSet() {
	if(CheckResult() != BOOL.TRUE) {
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');
	} else {
		GameController.GameOver = BOOL.TRUE;
		GameController.GameSaved = BOOL.TRUE; // save the game here
	}
	//var fenStr = BoardToFen();
	$("#currentFenSpan").text(BoardToFen());
}

function PreSearch() {

	if(GameController.GameOver != BOOL.TRUE) {
		srch_thinking = BOOL.TRUE;
		$('#ThinkingImageDiv').append('<image src="images/think3.png" id="ThinkingPng"/>')
		setTimeout( function() {StartSearch(); }, 200);
	}
}

function MakeUserMove() {

	if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {

		console.log("User Move:" + PrSq(UserMove.from) + PrSq(UserMove.to));

		var parsed = ParseMove(UserMove.from,UserMove.to);
        console.log(parsed)
		if(parsed != NOMOVE) {

			LAST_MOVE = parsed
			MakeMove(parsed);
			PrintBoard();
			MoveGUIPiece(parsed);
			CheckAndSet();
			queue_slider()
		}


		DeselectSq(UserMove.from);
		DeselectSq(UserMove.to);

		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ;
	}

}
function DeselectSq(sq) {

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	$( ".Square" ).each(function( index ) {
		if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){
			$(this).removeClass('SqSelected');
		}
	});
}
function PieceIsOnSq(sq, top, left) {

	if( (RanksBrd[sq] == 7 - Math.round(top/60) ) &&
		FilesBrd[sq] == Math.round(left/60) ) {
		return BOOL.TRUE;
	}

	return BOOL.FALSE;

}


// $(document).on('click','.Piece', function (e) {
// 	console.log('Piece Click');
//
// 	if(UserMove.from == SQUARES.NO_SQ) {
// 		UserMove.from = ClickedSquare(e.pageX, e.pageY);
// 		//$(this).clone().appendTo('#Board').css('z-index', 1000).prop('id', 'pieceDragged')
// 	}
// 	else {
// 		UserMove.to = ClickedSquare(e.pageX, e.pageY);
// 		if(ParseMove(UserMove.from,UserMove.to) != NOMOVE){
// 			MakeUserMove();
// 		}
// 		else{
// 			DeselectSq(UserMove.from);
// 			UserMove.from = UserMove.to
// 			UserMove.to = SQUARES.NO_SQ;
//
// 		}
// 	}
//
// });

$(document).on('click','.Square', function (e) {
	console.log('Square Click');
	if(UserMove.from != SQUARES.NO_SQ) {
		UserMove.to = ClickedSquare(e.pageX, e.pageY);
		MakeUserMove();
	}

});

function RemoveGUIPiece(sq) {
	//console.log("remove on:" + PrSq(sq));

	if(IS_EDIT){
	    $( ".piece-edit" ).each(function( index ) {
            //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
            if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){
                //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
                $(this).remove();
            }
	    });
	}
	else{
        $( ".Piece" ).each(function( index ) {
            //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
            if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){
                //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
                $(this).remove();
            }
        });
	}
}

function AddGUIPiece(sq,pce) {
	if(pce){
		var rank = RanksBrd[sq];
		var file = FilesBrd[sq];
		var rankName = "rank" + (rank + 1);
		var fileName = "file" + (file + 1);
		pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";

		if(IS_EDIT){
		    imageString = "<image data-id="+pce+" draggable=false  src=\"" + pieceFileName + "\" class=\"piece-edit clickElement game " + rankName + " " + fileName + "\"/>";
		}
		else{
		    imageString = "<image data-id="+pce+" draggable=false  src=\"" + pieceFileName + "\" class=\"Piece clickElement game " + rankName + " " + fileName + "\"/>";
		}

		//console.log("add on " + imageString);
		$("#Board").append(imageString);
	}
}

function MoveGUIPiece(move) {
	var from = FROMSQ(move);
	var to = TOSQ(move);

	var flippedFrom = from;
	var flippedTo = to;
	var epWhite = -10;
	var epBlack = 10;

	if(GameController.BoardFlipped == BOOL.TRUE) {
		flippedFrom = MIRROR120(from);
		flippedTo = MIRROR120(to);
		epWhite = 10;
		epBlack = -10;
	}

	if(move & MFLAGEP) {
		var epRemove;
		if(brd_side == COLOURS.BLACK) {
			epRemove = flippedTo + epWhite;
		} else {
			epRemove = flippedTo + epBlack;
		}
		console.log("en pas removing from " + PrSq(epRemove));
		RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		RemoveGUIPiece(flippedTo);
	}

	var rank = RanksBrd[flippedTo];
	var file = FilesBrd[flippedTo];
	var rankName = "rank" + (rank + 1);
	var fileName = "file" + (file + 1);

	/*if(GameController.BoardFlipped == BOOL.TRUE) {
		rankName += "flip";
		fileName += "flip";
	}*/

	$( ".Piece" ).each(function( index ) {
		//console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
		if( (RanksBrd[flippedFrom] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[flippedFrom] == Math.round($(this).position().left/60)) ){
			//console.log("Setting pic ff:" + FilesBrd[from] + " rf:" + RanksBrd[from] + " tf:" + FilesBrd[to] + " rt:" + RanksBrd[to]);
			$(this).removeClass();
			$(this).addClass("Piece clickElement game " + rankName + " " + fileName);
		}
	});

	if(move & MFLAGCA) {
		if(GameController.BoardFlipped == BOOL.TRUE) {
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(MIRROR120(SQUARES.H1));AddGUIPiece(MIRROR120(SQUARES.F1),PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(MIRROR120(SQUARES.A1));AddGUIPiece(MIRROR120(SQUARES.D1),PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(MIRROR120(SQUARES.H8));AddGUIPiece(MIRROR120(SQUARES.F8),PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(MIRROR120(SQUARES.A8));AddGUIPiece(MIRROR120(SQUARES.D8),PIECES.bR); break;
			}
		} else {
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(SQUARES.H1);AddGUIPiece(SQUARES.F1,PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(SQUARES.A1);AddGUIPiece(SQUARES.D1,PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(SQUARES.H8);AddGUIPiece(SQUARES.F8,PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(SQUARES.A8);AddGUIPiece(SQUARES.D8,PIECES.bR); break;
			}
		}
	}
	var prom = PROMOTED(move);
	console.log("PromPce:" + prom);
	if(prom != PIECES.EMPTY) {
		console.log("prom removing from " + PrSq(flippedTo));
		//RemoveGUIPiece(flippedTo);
		//AddGUIPiece(flippedTo, CHOUSEN_PIECE);


	}

	printGameLine();
}


function SetSqSelected(sq) {

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	$( ".Square" ).each(function( index ) {
		//console.log("Looking Sq Selected RanksBrd[sq] " + RanksBrd[sq] + " FilesBrd[sq] " + FilesBrd[sq] + " position " + Math.round($(this).position().left/60) + "," + Math.round($(this).position().top/60));
		if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){
			//console.log("Setting Selected Sq");
			$(this).addClass('SqSelected');
		}
	});
}

function StartSearch() {
	srch_depth = MAXDEPTH;
	var t = $.now();
	var tt = $('#ThinkTimeChoice').val();
	console.log("time:" + t + " TimeChoice:" + tt);
	srch_time = parseInt(tt) * 1000;
	//SearchPosition();

	// TODO MakeMove here on internal board and GUI
	MakeMove(srch_best);
	MoveGUIPiece(srch_best);
	$('#ThinkingPng').remove();
	CheckAndSet();
}

$("#TakeButton").click(function () {
	console.log('TakeBack request... brd_hisPly:' + brd_hisPly);
	if(brd_hisPly > 0) {
		TakeMove();
		brd_ply = 0;
		SetInitialBoardPieces();
		$("#currentFenSpan").text(BoardToFen());
		queue_slider()
	}
});

$("#SearchButton").click(function () {
	GameController.PlayerSide = brd_side^1;
	PreSearch();
});

$("#FlipButton").click(function () {
	GameController.BoardFlipped ^= 1;
	console.log("Flipped:" + GameController.BoardFlipped);
	initBoardSquares()
	SetInitialBoardPieces();

});

function NewGame() {
	GameController.GameOver = BOOL.TRUE;
	ParseFen(START_FEN);
	PrintBoard();
	SetInitialBoardPieces();
	GameController.PlayerSide = brd_side;
	//CheckAndSet();
	GameController.GameSaved = BOOL.FALSE;
	brd_ply = 0
	brd_posKey = null
	LAST_MOVE = 0
	$("#GameStatus").text('')
}

$("#NewGameButton").click(function () {
	NewGame();

	//newGameAjax();
});
$("#EditButton").click(function () {
	//ClearAllPieces();
	//newGameAjax();
	editBoard()
});
$("#FenButton").click(function () {
$('#GameStatus').text('')
    if($('#FenButton').hasClass('active')){
        $('#FenButton').removeClass('active')
        $('.fen-wrapper').hide()

    }
    else{
        $('#FenButton').addClass('active')
        $('.fen-wrapper').show()
        $('#fenIn').val(BoardToFen())

    }


});


$("#ClearButton").click(function () {
    $('#GameStatus').text('')
    for(var i = 0; i < 120; i++){
	    ClearPiece(i)
	}
	ClearAllPieces();
    brd_ply = 0
	brd_posKey = null
	LAST_MOVE = 0
	GameController.GameOver = BOOL.TRUE;

    if(!IS_EDIT){
        editBoard()
    }

	//PrintBoard()

	//newGameAjax();
});


function editBoard(){
    $('#GameStatus').text('')
    if($('#EditButton').hasClass('active')){
        $('.pieces-edit-map').hide()
        $('#EditButton').removeClass('active');
        $('.game').addClass('Piece').removeClass('piece-edit')
        IS_EDIT = false
        DRAGGED_PIECE_EDIT = 0


        //UserMove.from = SQUARES.NO_SQ
        //UserMove.to = SQUARES.NO_SQ
        $('.SqSelected').removeClass('SqSelected')

    }
    else{
        $('.pieces-edit-map').show()
        $('#EditButton').addClass('active');
        $('.game').addClass('piece-edit').removeClass('Piece')
        IS_EDIT = true
    }

}

function newGameAjax() {
	console.log('new Game Ajax');
	/*$.ajax({
		url : "insertNewGame.php",
		cache: false
		}).done(function( html ) {
		  console.log('result:' + html);
		});*/
}

function initBoardSquares() {


	var light = 0;
	var rankName;
	var fileName;
	var divString;
	var lightString;
	var lastLight=0;

	for(rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		light = lastLight ^ 1;
		lastLight ^= 1;
		rankName = "rank" + (rankIter + 1);
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
			fileName = "file" + (fileIter + 1);
			if(light==0) lightString="Light";
			else lightString="Dark";

			var coords = ''
			var coords_class = ''
			//GameController.BoardFlipped == 0
			if(GameController.BoardFlipped == false){
				switch (true) {
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_A) : coords = 'a';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_B) : coords = 'b';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_C) : coords = 'c';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_D) : coords = 'd';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_E) : coords = 'e';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_F) : coords = 'f';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_G) : coords = 'g';coords_class = 'cletter cletter-dark'; break;

					case (rankIter == RANKS.RANK_2 && fileIter == FILES.FILE_H) : coords = '2';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_3 && fileIter == FILES.FILE_H) : coords = '3';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_4 && fileIter == FILES.FILE_H) : coords = '4';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_5 && fileIter == FILES.FILE_H) : coords = '5';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_6 && fileIter == FILES.FILE_H) : coords = '6';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_7 && fileIter == FILES.FILE_H) : coords = '7';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_8 && fileIter == FILES.FILE_H) : coords = '8';coords_class = 'cnumber cnumber-dark'; break;
					//	case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_A) : coords = 'a'; break;

				}
			}
			else{
				switch (true) {
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_A) : coords = 'h';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_B) : coords = 'g';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_C) : coords = 'f';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_D) : coords = 'e';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_E) : coords = 'd';coords_class = 'cletter cletter-dark'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_F) : coords = 'c';coords_class = 'cletter cletter-light'; break;
					case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_G) : coords = 'b';coords_class = 'cletter cletter-dark'; break;

					case (rankIter == RANKS.RANK_2 && fileIter == FILES.FILE_H) : coords = '7';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_3 && fileIter == FILES.FILE_H) : coords = '6';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_4 && fileIter == FILES.FILE_H) : coords = '5';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_5 && fileIter == FILES.FILE_H) : coords = '4';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_6 && fileIter == FILES.FILE_H) : coords = '3';coords_class = 'cnumber cnumber-dark'; break;
					case (rankIter == RANKS.RANK_7 && fileIter == FILES.FILE_H) : coords = '2';coords_class = 'cnumber cnumber-light'; break;
					case (rankIter == RANKS.RANK_8 && fileIter == FILES.FILE_H) : coords = '1';coords_class = 'cnumber cnumber-dark'; break;
					//	case (rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_A) : coords = 'a'; break;

				}
			}

			if(rankIter == RANKS.RANK_1 && fileIter == FILES.FILE_H){
				if(GameController.BoardFlipped == false){
					divString = "<div class=\"Square clickElement " + rankName + " " + fileName + " " + lightString + "\">" +
						"<span class='cnumber cnumber-light'>"+ '1' + "</span><span class='cletter cletter-light'>"+ 'h' +"</div>";
				}
				else{
					divString = "<div class=\"Square clickElement " + rankName + " " + fileName + " " + lightString + "\">" +
						"<span class='cnumber cnumber-light'>"+ '8' + "</span><span class='cletter cletter-light'>"+ 'a' +"</div>";
				}
			}
			else{

				divString = "<div class=\"Square clickElement " + rankName + " " + fileName + " " + lightString + "\">" +
					"<span class='"+ coords_class +"'>"+ coords +"</div>";
			}



			light ^= 1;
			$("#Board").append(divString);
		}
	}
}

function ClearAllPieces() {
	console.log("Removing pieces");
	$(".game").remove();
	PrintBoard()

}

function SetInitialBoardPieces() {
	var sq;
	var sq120;
	var file,rank;
	var rankName;
	var fileName;
	var imageString;
	var pieceFileName;
	var pce;
	ClearAllPieces();
	for( sq = 0; sq < 64; ++sq) {

		sq120 = SQ120(sq);

		pce = brd_pieces[sq120]; // crucial here

		if(GameController.BoardFlipped == BOOL.TRUE) {
			sq120 = MIRROR120(sq120);
		}

		file = FilesBrd[sq120];
		rank = RanksBrd[sq120];


		if(pce>=PIECES.wP && pce<=PIECES.bK) {
			rankName = "rank" + (rank + 1);
			fileName = "file" + (file + 1);

			pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";

			if(IS_EDIT){
                imageString = "<image data-id="+pce+" draggable=false src=\"" + pieceFileName + "\" class=\"piece-edit game " + rankName + " " + fileName + "\"/>";
                }
            else{
                imageString = "<image data-id="+pce+" draggable=false src=\"" + pieceFileName + "\" class=\"Piece game " + rankName + " " + fileName + "\"/>";
            }
			//console.log(imageString);
			$("#Board").append(imageString);
		}
	}

}








function ThreeFoldRep() {
	var i = 0, r = 0;
	for (i = 0; i < brd_hisPly; ++i)	{
		if (brd_history[i].posKey == brd_posKey) {
			r++;
		}
	}
	return r;
}

function DrawMaterial() {

	if (brd_pceNum[PIECES.wP]!=0 || brd_pceNum[PIECES.bP]!=0) return BOOL.FALSE;
	if (brd_pceNum[PIECES.wQ]!=0 || brd_pceNum[PIECES.bQ]!=0 || brd_pceNum[PIECES.wR]!=0 || brd_pceNum[PIECES.bR]!=0) return BOOL.FALSE;
	if (brd_pceNum[PIECES.wB] > 1 || brd_pceNum[PIECES.bB] > 1) {return BOOL.FALSE;}
	if (brd_pceNum[PIECES.wN] > 1 || brd_pceNum[PIECES.bN] > 1) {return BOOL.FALSE;}
	if (brd_pceNum[PIECES.wN]!=0 && brd_pceNum[PIECES.wB]!=0) {return BOOL.FALSE;}
	if (brd_pceNum[PIECES.bN]!=0 && brd_pceNum[PIECES.bB]!=0) {return BOOL.FALSE;}

	return BOOL.TRUE;
}








































