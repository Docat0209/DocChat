import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

const FIXTURES_DIR = path.join(__dirname)

async function generatePdf() {
  return new Promise<void>((resolve) => {
    const doc = new PDFDocument()
    const stream = fs.createWriteStream(path.join(FIXTURES_DIR, 'test-document.pdf'))

    doc.pipe(stream)

    // Page 1
    doc.fontSize(24).text('DocChat Test Document', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text('Page 1: Introduction to Artificial Intelligence')
    doc.moveDown()
    doc.text(
      'Artificial intelligence (AI) is a branch of computer science that aims to create intelligent machines that can perform tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding.',
    )
    doc.moveDown()
    doc.text(
      'Machine learning is a subset of AI that focuses on developing algorithms that can learn from and make predictions based on data. Deep learning, a subset of machine learning, uses neural networks with multiple layers to analyze complex patterns in large amounts of data.',
    )

    // Page 2
    doc.addPage()
    doc.fontSize(12).text('Page 2: Applications of AI')
    doc.moveDown()
    doc.text('AI has numerous applications across various industries:')
    doc.moveDown()
    doc.text(
      '1. Healthcare: AI is used for medical diagnosis, drug discovery, and personalized treatment plans.',
    )
    doc.text('2. Finance: AI powers fraud detection, algorithmic trading, and risk assessment.')
    doc.text('3. Transportation: Self-driving cars and traffic optimization rely on AI systems.')
    doc.text('4. Education: AI enables personalized learning experiences and automated grading.')

    // Page 3
    doc.addPage()
    doc.fontSize(12).text('Page 3: Natural Language Processing')
    doc.moveDown()
    doc.text(
      'Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. Key NLP tasks include:',
    )
    doc.moveDown()
    doc.text('- Text classification: Categorizing text into predefined groups')
    doc.text('- Sentiment analysis: Determining the emotional tone of text')
    doc.text(
      '- Named entity recognition: Identifying entities like people, places, and organizations',
    )
    doc.text('- Machine translation: Translating text from one language to another')
    doc.text('- Question answering: Providing answers to questions based on given context')

    doc.end()
    stream.on('finish', resolve)
  })
}

async function generateDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'DocChat Test Document',
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: 'Chapter 1: Climate Change Overview',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Climate change refers to long-term shifts in global or regional climate patterns. Since the mid-20th century, human activities have been the main driver of climate change, primarily due to the burning of fossil fuels which increases greenhouse gas concentrations in the atmosphere.',
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'The main greenhouse gases include carbon dioxide (CO2), methane (CH4), and nitrous oxide (N2O). These gases trap heat in the atmosphere, leading to a gradual increase in global temperatures known as global warming.',
              ),
            ],
          }),
          new Paragraph({
            text: 'Chapter 2: Effects of Climate Change',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun('The effects of climate change are widespread and significant:'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Rising sea levels threaten coastal communities and island nations. The melting of polar ice caps and glaciers contributes to sea level rise, which can lead to flooding and displacement of populations.',
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Extreme weather events such as hurricanes, droughts, and heatwaves are becoming more frequent and intense. These events can cause significant damage to infrastructure, agriculture, and human health.',
              ),
            ],
          }),
          new Paragraph({
            text: 'Chapter 3: Solutions and Mitigation',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Addressing climate change requires a combination of mitigation and adaptation strategies:',
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                '1. Renewable Energy: Transitioning from fossil fuels to renewable energy sources like solar, wind, and hydroelectric power can significantly reduce greenhouse gas emissions.',
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                '2. Energy Efficiency: Improving energy efficiency in buildings, transportation, and industry can reduce overall energy consumption and emissions.',
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                '3. Carbon Capture: Technologies that capture and store carbon dioxide from the atmosphere or industrial processes can help reduce atmospheric CO2 levels.',
              ),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(FIXTURES_DIR, 'test-document.docx'), buffer)
}

function generateTxt() {
  const content = `DocChat Test Document - Software Engineering Best Practices

Section 1: Code Quality

Writing clean, maintainable code is essential for long-term project success. Key principles include:

- Single Responsibility Principle: Each function or class should have one clear purpose
- DRY (Don't Repeat Yourself): Avoid duplicating code by extracting common logic into reusable functions
- KISS (Keep It Simple, Stupid): Prefer simple solutions over complex ones
- Code Reviews: Regular peer reviews catch bugs early and spread knowledge across the team

Section 2: Testing Strategies

A comprehensive testing strategy includes multiple layers:

Unit tests verify individual functions and components in isolation. They should be fast, deterministic, and cover edge cases. Mock external dependencies to keep unit tests focused.

Integration tests verify that components work together correctly. They test real database queries, API calls, and service interactions. Integration tests are slower but catch bugs that unit tests miss.

End-to-end tests simulate real user interactions in a browser. They verify complete user flows like signup, login, file upload, and chat. E2E tests are the most valuable but also the slowest.

Section 3: Continuous Integration

CI/CD pipelines automate the build, test, and deployment process:

- Every pull request triggers automated tests
- Code must pass linting, type checking, and all tests before merging
- Automated deployments reduce human error and speed up releases
- Branch protection rules prevent merging broken code into main branches

Section 4: Version Control Best Practices

Effective use of version control improves team collaboration:

- Write clear, descriptive commit messages using conventional commits format
- Keep commits atomic - each commit should represent one logical change
- Use feature branches for all new work
- Review your own code before requesting peer review
- Delete merged branches to keep the repository clean`

  fs.writeFileSync(path.join(FIXTURES_DIR, 'test-document.txt'), content)
}

async function main() {
  console.log('Generating test fixtures...')

  console.log('Creating PDF...')
  await generatePdf()
  console.log('test-document.pdf created')

  console.log('Creating DOCX...')
  await generateDocx()
  console.log('test-document.docx created')

  console.log('Creating TXT...')
  generateTxt()
  console.log('test-document.txt created')

  console.log('Done!')
}

main().catch(console.error)
