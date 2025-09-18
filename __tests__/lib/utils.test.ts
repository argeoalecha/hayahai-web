import { slugify, calculateReadTime, generateExcerpt } from '@/lib/utils'

describe('Utils', () => {
  describe('slugify', () => {
    it('converts text to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('The Quick Brown Fox')).toBe('the-quick-brown-fox')
      expect(slugify('Special Characters!@#$%')).toBe('special-characters')
    })

    it('handles empty and edge cases', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
      expect(slugify('123')).toBe('123')
      expect(slugify('àáâãäåæçèéêë')).toBe('aaaaaaaaceee')
    })

    it('removes consecutive dashes', () => {
      expect(slugify('Hello    World')).toBe('hello-world')
      expect(slugify('Multiple---Dashes')).toBe('multiple-dashes')
    })

    it('trims leading and trailing dashes', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world')
      expect(slugify('-Leading and trailing-')).toBe('leading-and-trailing')
    })
  })

  describe('calculateReadTime', () => {
    it('calculates read time for short content', () => {
      const shortContent = 'This is a short piece of content with about twenty words in total for testing purposes.'
      expect(calculateReadTime(shortContent)).toBe(1) // Minimum 1 minute
    })

    it('calculates read time for medium content', () => {
      const words = Array(250).fill('word').join(' ')
      expect(calculateReadTime(words)).toBe(1) // 250 words = 1 minute at 200 WPM
    })

    it('calculates read time for long content', () => {
      const words = Array(1000).fill('word').join(' ')
      expect(calculateReadTime(words)).toBe(5) // 1000 words = 5 minutes at 200 WPM
    })

    it('handles empty content', () => {
      expect(calculateReadTime('')).toBe(1)
      expect(calculateReadTime('   ')).toBe(1)
    })

    it('counts words accurately', () => {
      const content = 'One two three four five'
      expect(calculateReadTime(content)).toBe(1) // 5 words, minimum 1 minute
    })
  })

  describe('generateExcerpt', () => {
    it('generates excerpt from short content', () => {
      const content = 'This is a short piece of content.'
      expect(generateExcerpt(content)).toBe('This is a short piece of content.')
    })

    it('truncates long content to 160 characters', () => {
      const longContent = 'This is a very long piece of content that should be truncated to a reasonable length for use as an excerpt. It contains many words and should be cut off at around 160 characters with an ellipsis.'
      const excerpt = generateExcerpt(longContent)

      expect(excerpt.length).toBeLessThanOrEqual(163) // 160 + '...'
      expect(excerpt).toEndWith('...')
      expect(excerpt).not.toContain('ellipsis') // Should be cut off before this word
    })

    it('handles content with HTML tags', () => {
      const htmlContent = '<p>This is <strong>bold</strong> text with <em>emphasis</em>.</p>'
      const excerpt = generateExcerpt(htmlContent)

      expect(excerpt).toBe('This is bold text with emphasis.')
      expect(excerpt).not.toContain('<')
      expect(excerpt).not.toContain('>')
    })

    it('handles empty and whitespace content', () => {
      expect(generateExcerpt('')).toBe('')
      expect(generateExcerpt('   ')).toBe('')
      expect(generateExcerpt('\n\t  \n')).toBe('')
    })

    it('preserves sentence structure when truncating', () => {
      const content = 'First sentence. Second sentence is much longer and should be cut off. Third sentence should not appear.'
      const excerpt = generateExcerpt(content, 50)

      expect(excerpt).toBe('First sentence. Second sentence is much longer...')
    })

    it('handles custom length parameter', () => {
      const content = 'This is a test content for excerpt generation.'

      expect(generateExcerpt(content, 20)).toBe('This is a test...')
      expect(generateExcerpt(content, 100)).toBe('This is a test content for excerpt generation.')
    })
  })
})