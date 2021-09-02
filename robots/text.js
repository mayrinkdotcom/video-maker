const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        try {
            const algorithmiaAuthenticated = algorithmia.client(algorithmiaApiKey)
            const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
            const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
            const wikipediaContent = wikipediaResponse.get()
            content.sourceContentOriginal = wikipediaContent.content
        } catch (e) {
            console.log('error on fetchContentFromWikipedia: ', e)
        }
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter(line => {
                return !(line.trim().length === 0 || line.trim().startsWith('='))
            })
            return withoutBlankLinesAndMarkdown.join(' ')
        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[⁽)])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot