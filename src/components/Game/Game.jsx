import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import { fetchApiData,fetchApiToken } from "./GameApi";


function Game() {
  const { user, logout, quizData,setQuizData,apiToken,setApiToken } = useContext(UserContext);
  
  const [questionIndex,setQuestionIndex] = useState(0);
  
  const [gameIsActive,setGameIsActive] = useState(false);
  
  const [isGameOver,setIsGameOver] = useState(false);
  const [roundIsOver,setRoundIsOver] = useState(false)
  
  const [correctAnswers,setCorrectAnswers] = useState(0);
  const [playerLives,setPlayLives] = useState(10);

  const [timer,setTimer] = useState(20);
  
  useEffect(() => {
    fetchApiToken(setApiToken)
  },[])
  
  useEffect(() => {
    console.log(quizData)
  },[quizData])
  
  useEffect(() => {
      
    if(timer === 0 || !gameIsActive) return;

    const timerTimeout = setTimeout(() => {
      if(roundIsOver){
       clearTimeout(timerTimeout)
      }
      else{
        setTimer((prevState) => prevState - 1)
      }
        
    },1000)
    return () => clearTimeout(timerTimeout)
  },[timer,gameIsActive,roundIsOver])

  const updateQuestionIndex = () => {
    setTimer(10);
    setQuestionIndex((prevIndex) => {
      
      if (prevIndex === quizData.length - 2) {
        fetchApiData(apiToken,setQuizData); 
      }
      return prevIndex + 1;
    });
    
  }

  const checkAnswer = (e,index) => {
    const {value} = e.target;

    if(value === quizData[index].correctAnswer){
        console.log("correct answer")
        setCorrectAnswers((prevState) => prevState + 1);
        setRoundIsOver(true)
        
        
    }else{
      console.log("Wrong answer")
      setRoundIsOver(true)
      
      setPlayLives((prevState) => {
        if(prevState -1 === 0){
          setIsGameOver(true)
          return prevState - 1
        }else{
          return prevState - 1
          
        }
      })
      
    }
    
  }
  const renderQuizElements = () => {
    const currentQuestion = quizData[questionIndex];  
    if (!currentQuestion) return null; 
    return (
      <div key={questionIndex}>
        <h2>{currentQuestion.question}</h2>
        {currentQuestion.answers.map((answer, id) => (
          <button key={id} onClick={(e) => checkAnswer(e, questionIndex)} value={answer}>
            {answer}
          </button>
        ))}
      </div>
    );      
  }
  
 
  
  return (
    <div>
    {user? (
      <>
      <h2>{timer}</h2>
        {isGameOver && <h1>GAME IS OVER</h1>}
        <h2>CORRECT ANSWERS:{correctAnswers}</h2>
        <h2>PLAYER LIVES :{playerLives}</h2>
        {gameIsActive && roundIsOver ? <h2>{quizData[questionIndex].correctAnswer}</h2> : null}
        {!gameIsActive && <button onClick={() => {setGameIsActive(true),fetchApiData(apiToken,setQuizData)}}>Start Quiz</button>}
        {gameIsActive ? renderQuizElements(): null}
        {roundIsOver && !isGameOver ? <button onClick={() => {updateQuestionIndex(),setRoundIsOver(false)}}>Next question</button>:null}
        </>
      )
       : (
        <h1>Please log in to play the game.</h1> 
       )
        
      }
    </div>
  );
}

export default Game;
