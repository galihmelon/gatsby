jest.mock(`gatsby-cli/lib/reporter`)
jest.mock(`progress`)
const {
  createGatsbyProgressOrFallbackToExternalProgressBar,
  calculateImageSizes,
} = require(`../utils`)
const reporter = require(`gatsby-cli/lib/reporter`)
const progress = require(`progress`)

describe(`createGatsbyProgressOrFallbackToExternalProgressBar`, () => {
  beforeEach(() => {
    progress.mockClear()
  })

  it(`should use createProgress from gatsby-cli when available`, () => {
    createGatsbyProgressOrFallbackToExternalProgressBar(`test`, reporter)
    expect(reporter.createProgress).toBeCalled()
    expect(progress).not.toBeCalled()
  })

  it(`should fallback to a local implementation when createProgress does not exists on reporter`, () => {
    reporter.createProgress = null
    const bar = createGatsbyProgressOrFallbackToExternalProgressBar(
      `test`,
      reporter
    )
    expect(progress).toHaveBeenCalledTimes(1)
    expect(bar).toHaveProperty(`start`, expect.any(Function))
    expect(bar).toHaveProperty(`tick`, expect.any(Function))
    expect(bar).toHaveProperty(`done`, expect.any(Function))
    expect(bar).toHaveProperty(`total`)
  })

  it(`should fallback to a local implementation when no reporter is present`, () => {
    const bar = createGatsbyProgressOrFallbackToExternalProgressBar(`test`)
    expect(progress).toHaveBeenCalledTimes(1)
    expect(bar).toHaveProperty(`start`, expect.any(Function))
    expect(bar).toHaveProperty(`tick`, expect.any(Function))
    expect(bar).toHaveProperty(`done`, expect.any(Function))
    expect(bar).toHaveProperty(`total`)
  })
})

const file = {
  absolutePath: `~/Usr/gatsby-sites/src/img/photo.png`,
}
const imgDimensions = {
  width: 1200,
  height: 800,
}

describe(`calculateImageSizes (fixed)`, () => {
  it(`should throw if width is less than 1`, () => {
    const args = {
      layout: `fixed`,
      width: 0,
      file,
      imgDimensions,
    }
    const getSizes = () => calculateImageSizes(args)
    expect(getSizes).toThrow()
  })

  it(`should throw if height is less than 1`, () => {
    const args = {
      layout: `fixed`,
      height: -50,
      file,
      imgDimensions,
    }
    const getSizes = () => calculateImageSizes(args)
    expect(getSizes).toThrow()
  })

  it(`should warn if ignored maxWidth or maxHeight are passed in`, () => {
    jest.spyOn(global.console, `warn`)
    const args = {
      layout: `fixed`,
      height: 240,
      maxWidth: 1000,
      maxHeight: 1000,
      file,
      imgDimensions,
    }
    calculateImageSizes(args)
    expect(console.warn).toBeCalled()
  })

  it(`should return the original width of the image when only width is provided`, () => {
    const args = {
      layout: `fixed`,
      width: 600,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toContain(600)
  })

  it(`should return the original width of the image when only height is provided`, () => {
    const args = {
      layout: `fixed`,
      height: 500,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toContain(500 * (imgDimensions.width / imgDimensions.height))
  })

  it(`should create images of different sizes based on pixel densities with a given width`, () => {
    const args = {
      layout: `fixed`,
      width: 120,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([120, 240]))
  })

  it(`should create images of different sizes based on pixel densities with a given height`, () => {
    const args = {
      layout: `fixed`,
      height: 80,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([120, 240]))
  })
})

describe(`calculateImageSizes (fluid & constrained)`, () => {
  it(`should throw if maxWidth is less than 1`, () => {
    const args = {
      layout: `fluid`,
      maxWidth: 0,
      file,
      imgDimensions,
    }
    const getSizes = () => calculateImageSizes(args)
    expect(getSizes).toThrow()
  })

  it(`should throw if maxHeight is less than 1`, () => {
    const args = {
      layout: `fluid`,
      maxHeight: -50,
      file,
      imgDimensions,
    }
    const getSizes = () => calculateImageSizes(args)
    expect(getSizes).toThrow()
  })

  it(`should warn if ignored width or height are passed in`, () => {
    jest.spyOn(global.console, `warn`)
    const args = {
      layout: `fluid`,
      maxWidth: 240,
      height: 1000,
      width: 1000,
      file,
      imgDimensions,
    }
    calculateImageSizes(args)
    expect(console.warn).toBeCalled()
  })

  it(`should include the original size of the image when maxWidth is passed`, () => {
    const args = {
      layout: `fluid`,
      maxWidth: 400,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toContain(400)
  })

  it(`should include the original size of the image when maxWidth is passed for a constrained image`, () => {
    const args = {
      layout: `constrained`,
      maxWidth: 400,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toContain(400)
  })

  it(`should include the original size of the image when maxHeight is passed`, () => {
    const args = {
      layout: `fluid`,
      maxHeight: 300,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toContain(450)
  })

  it(`should create images of different sizes (0.25x, 0.5x, 1x, 2x) from a maxWidth`, () => {
    const args = {
      layout: `fluid`,
      maxWidth: 320,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([80, 160, 320, 640]))
  })

  it(`should create images of different sizes (0.25x, 0.5x, 1x) without any defined size provided`, () => {
    const args = {
      layout: `fluid`,
      file,
      imgDimensions,
    }
    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([200, 400, 800]))
  })

  it(`should return sizes of provided srcSetBreakpoints`, () => {
    const srcSetBreakpoints = [50, 70, 150, 250, 300]
    const maxWidth = 500
    const args = {
      layout: `fluid`,
      maxWidth,
      srcSetBreakpoints,
      file,
      imgDimensions,
    }

    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([50, 70, 150, 250, 300, 500]))
  })

  it(`should reject any srcSetBreakpoints larger than the original width`, () => {
    const srcSetBreakpoints = [
      50,
      70,
      150,
      250,
      1250, // shouldn't be included, larger than original width
    ]
    const maxWidth = 1500 // also shouldn't be included
    const args = {
      layout: `fluid`,
      maxWidth,
      srcSetBreakpoints,
      file,
      imgDimensions,
    }

    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([50, 70, 150, 250]))
    expect(sizes).toEqual(expect.not.arrayContaining([1250, 1500]))
  })

  it(`should only uses sizes from srcSetBreakpoints when outputPixelDensities are also passed in`, () => {
    jest.spyOn(global.console, `warn`)
    const srcSetBreakpoints = [400, 800] // should find these
    const maxWidth = 500
    const args = {
      layout: `fluid`,
      maxWidth,
      outputPixelDensities: [2, 4], // and ignore these, ie [1000, 2000]
      srcSetBreakpoints,
      file,
      imgDimensions,
    }

    const sizes = calculateImageSizes(args)
    expect(sizes).toEqual(expect.arrayContaining([400, 500, 800]))
    expect(console.warn).toBeCalled()
  })
})
