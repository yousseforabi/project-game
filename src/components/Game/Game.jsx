import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import { fetchApiData,fetchApiToken } from "./GameApi";
import TimeoutLightbox from "./TimeoutLightbox";


function Game() {
  const { user, logout, quizData,setQuizData,apiToken,setApiToken } = useContext(UserContext);
  
  const [gameState,setGameState] = useState({
    questionIndex:0,
    gameIsActive:false,
    isGameOver:false,
    roundIsOver:false,
    correctAnswers:0,
    playerLives:100,
    timer:10,
    atCheckpoint:false,
    fiftyFiftyActive:false,
    googleTimeoutActive:false,
    googleTimer:45,
    pointsMultiplier:1,
    hotStreak:0,
    doublePointsIndex:[],
    timesDataFetched:null
  })
  
  const [correctFirst,setCorrectFirst] = useState()
  
  useEffect(() => {
    fetchApiToken(setApiToken)
  },[])
  
  useEffect(() => {
    setCorrectFirst(Math.random() < 0.5);
    console.log(gameState.doublePointsIndex)
  },[gameState.questionIndex])
  
  useEffect(() => {
    if(quizData.length <= 0)return;
    
    let fetchedQuestions = quizData.slice(gameState.questionIndex);

    const randomChance = Math.random() * 100;
    let numDoublePoints = 0;

    if(randomChance < 20){
      numDoublePoints = 0;
    }else if (randomChance < 80){
      numDoublePoints = 1;
    }else{
      numDoublePoints = 2;
    }
    
    let doublePointsIndices = new Set();

    while(doublePointsIndices.size < numDoublePoints){
      const randomIndex = Math.floor(Math.random() * (fetchedQuestions.length) + gameState.questionIndex );
      doublePointsIndices.add(randomIndex);
    }


    
    setGameState((prevState) => ({
      ...prevState,
      doublePointsIndex:Array.from(doublePointsIndices),
      timesDataFetched: prevState.timesDataFetched === null ? 0 : prevState.timesDataFetched + 1
    }))
  },[quizData])
 
  useEffect(() => {
    console.log(gameState.pointsMultiplier)
  },[gameState.questionIndex])


  useEffect(() => {
    if(!gameState.googleTimeoutActive)return

    if(gameState.googleTimer === 0){
      setGameState((prevState) => ({
        ...prevState,
        googleTimer:45,
        googleTimeoutActive:false
      }))
    }

    const googleTimerTimeout = setTimeout(() => {
        setGameState((prevState) => ({
          ...prevState,
          googleTimer:prevState.googleTimer - 1
        }))
      
    },1000)


    return () => clearTimeout(googleTimerTimeout)
  },[gameState.googleTimeoutActive,gameState.googleTimer])
  
  useEffect(() => {
      
    if(!gameState.gameIsActive || gameState.atCheckpoint) return;

    const timerTimeout = setTimeout(() => {
      if(gameState.roundIsOver || gameState.googleTimeoutActive){
       clearTimeout(timerTimeout)
      }
      else{
        setGameState((prevState) => ({
          ...prevState,
          timer:prevState.timer - 1
        }))
      }
    },1000)

    if(gameState.timer === 0 && !gameState.roundIsOver){
      clearTimeout(timerTimeout)
      setGameState((prevState) => ({
        ...prevState,
        roundIsOver: true,
        playerLives: prevState.playerLives - 1,
        isGameOver: prevState.playerLives -1 === 0 ? true:prevState.isGameOver,
        hotStreak:0
      }))
      return;
    }

    return () => clearTimeout(timerTimeout)
  },[gameState.timer,gameState.gameIsActive,gameState.roundIsOver,gameState.atCheckpoint,gameState.googleTimeoutActive])

  const updateQuestionIndex = () => {
    setGameState((prevState) => {
      const nextIndex = prevState.questionIndex + 1;
      if(prevState.questionIndex === quizData.length -1){
        fetchApiData(apiToken,setQuizData); 
      }
      if(nextIndex % 10 === 0){
          console.log("checkpoint reached")
          setGameState((prevState) => {
            return {
              ...prevState,
              atCheckpoint:true
            }
          })
      }
     const isDoublePoints = prevState.doublePointsIndex.includes(nextIndex);
      return {
        ...prevState,
        timer:10,
        fiftyFiftyActive:false,
        questionIndex:prevState.questionIndex + 1,
        pointsMultiplier: isDoublePoints
        ? (prevState.hotStreak >= 3 ? 4 : 2)
        : prevState.hotStreak >= 3
        ? 2
        : 1,
        
        // Test checkpoint might change later.
        playerLives:prevState.playerLives + (nextIndex % 10 === 0 ? 1 : 0)
      };
    });
    
    
  }

  const checkAnswer = (e,index) => {
    const {value} = e.target;

    if(value === quizData[index].correctAnswer){
        console.log("correct answer")
        setGameState((prevState) => ({
          ...prevState,
          correctAnswers: prevState.correctAnswers + 1 * gameState.pointsMultiplier ,
          roundIsOver:true,
          hotStreak: prevState.hotStreak + 1
        }))
    }else{
      console.log("Wrong answer")
      setGameState((prevState) => {
        const newLivesRemaning = prevState.playerLives - 1;
        return {
          ...prevState,
          roundIsOver:true,
          playerLives:newLivesRemaning,
          isGameOver: newLivesRemaning === 0 ? true : prevState.isGameOver,
          hotStreak: 0
        };
      })
    }
  }
  const renderQuizElements = () => {
    const currentQuestion = quizData[gameState.questionIndex];  
    if (!currentQuestion) return null; 
    if(gameState.fiftyFiftyActive){
      return fiftyFiftyRender()
    }else if (gameState.questionIndex === 2){
      return correctOnlyRender()
    }else{
      return (
        <div className="quiz-content-container" key={gameState.questionIndex}>
          <h2>{currentQuestion.question}</h2>
          <div className="answers-container">
          {currentQuestion.answers.map((answer, index) => (
            <button className={`quiz-answer ${gameState.roundIsOver ? (answer === currentQuestion.correctAnswer ? "correct" : "incorrect") : ""}`} key={index} disabled={gameState.roundIsOver} onClick={(e) => checkAnswer(e, gameState.questionIndex)} value={answer}>
              {answer}
            </button>
          ))}
          </div>
        </div>
      );      
    }
  }
  
  const correctOnlyRender = () => {
   
    const currentQuestion = quizData[gameState.questionIndex];  
    if (!currentQuestion) return null; 
    const correctButtonsArray = [];
    for(let i = 0;  i < 4; i++){
     const correctButton = <button 
        className={`quiz-answer ${gameState.roundIsOver ? "correct": "" }`}
         key={i} disabled={gameState.roundIsOver} 
         onClick={(e) => checkAnswer(e, gameState.questionIndex)} value={currentQuestion.correctAnswer}>
         {currentQuestion.correctAnswer}
       </button>
       correctButtonsArray.push(correctButton)
    }
    return (
      <div className="quiz-content-container" key={gameState.questionIndex}>
          <h2>{currentQuestion.question}</h2>
          <div className="answers-container">
            {correctButtonsArray}
          </div>
        </div>
    )
    
  }


  

  const fiftyFiftyRender = () => {
    const currentQuestion = quizData[gameState.questionIndex];
    if (!currentQuestion) return null; 

    return (
      <div className="quiz-content-container">
        <h2>{currentQuestion.question}</h2>
        
        {correctFirst ? (
          <div className="answers-container">
            <button
              disabled={gameState.roundIsOver}
              className={`quiz-answer ${gameState.roundIsOver ? "correct" : ""}`}
              onClick={(e) => checkAnswer(e, gameState.questionIndex)}
              value={currentQuestion.correctAnswer}
            >
              {currentQuestion.correctAnswer}
            </button>
            <button
              disabled={gameState.roundIsOver}
              className={`quiz-answer ${gameState.roundIsOver ? "incorrect" : ""}`}
              onClick={(e) => checkAnswer(e, gameState.questionIndex)}
              value={currentQuestion.incorrectAnswers[0]}
            >
              {currentQuestion.incorrectAnswers[0]}
            </button>
          </div>
        ) : (
          <div className="answers-container">
            <button
              disabled={gameState.roundIsOver}
              className={`quiz-answer ${gameState.roundIsOver ? "incorrect" : ""}`}
              onClick={(e) => checkAnswer(e, gameState.questionIndex)}
              value={currentQuestion.incorrectAnswers[0]}
            >
              {currentQuestion.incorrectAnswers[0]}
            </button>
            <button
              disabled={gameState.roundIsOver}
              className={`quiz-answer ${gameState.roundIsOver ? "correct" : ""}`}
              onClick={(e) => checkAnswer(e, gameState.questionIndex)}
              value={currentQuestion.correctAnswer}
            >
              {currentQuestion.correctAnswer}
            </button>
          </div>
        )}
      </div>
    );      
};



 const resetGame = () => {
  
  setGameState((prevState) => {
    return {
      ...prevState,
      playerLives:10,
      correctAnswers:0,
      timer:10,
      gameIsActive:false,
      isGameOver:false,
      roundIsOver:false,
      questionIndex:0,
    }
  })
  setQuizData([])

 }
  
  return (
    <div className="game-container">
   { (user && user.loggedIn) ? (
      gameState.questionIndex >= 10 && (gameState.questionIndex + 1)% 10 === 1 && gameState.atCheckpoint?(
        <div className="checkpoint">
            <h1>Checkpoint reached</h1>
            <button className="next-round" onClick={() => setGameState(prevState => ({ ...prevState, atCheckpoint: false }))}>Continue</button>
        </div>
      ):(
        <> 
          {gameState.googleTimeoutActive ? <TimeoutLightbox setGameState = {setGameState} timer = {gameState.googleTimer} question ={quizData[gameState.questionIndex].question}/> : null}
          <h2>Round {gameState.questionIndex + 1}</h2>
          <h2>{gameState.timer}</h2>
          <h2>{gameState.doublePointsIndex.includes(gameState.questionIndex) ? "DOUBLE POINTS ROUND" : null}</h2>
          <h2>{gameState.hotStreak >= 3 ? "Hotstreak active": "Hotstreak not active"}</h2>
          {gameState.isGameOver && <h1>GAME IS OVER</h1>}
          <h2>Points:{gameState.correctAnswers}</h2>
          <h2>PLAYER LIVES :{gameState.playerLives}</h2>
          {!gameState.gameIsActive &&  <button className="start-quiz" onClick={() => {setGameState((prevState) => ({...prevState,gameIsActive:true})),fetchApiData(apiToken,setQuizData)}}>Start Quiz</button>}
          {gameState.isGameOver && <button className="play-again" onClick={resetGame}>Play again</button>}
          {gameState.gameIsActive && !gameState.isGameOver ? renderQuizElements(): null}
          {gameState.roundIsOver && !gameState.isGameOver ? <button  className="next-question" onClick={() => {updateQuestionIndex(),setGameState((prevState) => ({...prevState,roundIsOver:false}))}}>Next question</button>:null}
          <button onClick={() => setGameState((prevState) => ({ ...prevState, fiftyFiftyActive: true }))}>Activate fiftyFifty</button>
          <button onClick={() => setGameState((prevState) => ({...prevState,googleTimeoutActive:true}))}>Activate google timeout</button>
          <button className="logout" onClick={logout}>Logout</button>
        </>
      )
      )
       : (
        <h1 className="welcome">Please log in to play the game.</h1> 
       )
      }
    </div>
  );
}

export default Game;
